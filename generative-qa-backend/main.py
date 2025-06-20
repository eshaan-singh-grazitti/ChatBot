import csv
from io import StringIO
from fastapi import FastAPI,Depends,APIRouter,HTTPException,Response
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from rag_engine import generate_answer
from sqlalchemy.orm import Session
from sqlalchemy import func,case
from typing import List,Optional
from models import Feedback
from database import Base,engine,SessionLocal
from datetime import datetime,timedelta
from collections import Counter
from utils.refresh import refresh_if_updated
from jose import JWTError, jwt
import bcrypt
import uvicorn


Base.metadata.create_all(bind=engine)


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

users_db = {
    "admin@123.com":{
        "hashed_password":bcrypt.hashpw(b"admin@123",bcrypt.gensalt()).decode('utf-8'),
    }
}

SECRET_KEY = "sk_dev_7x9mK2pL8qR3nV6wE4tY1uI0oP5sA7bN9cF2gH8jM3kL6zX4vB1nQ9rT8yU3iO7pA5sD2fG6hJ4k"
ALGO = "HS256"
ACCESS_TIME = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class LoginModel(BaseModel):
    email:str
    password:str

class AskRequest(BaseModel):
    session_id: Optional[str] = None
    question:str


class FeedbackRequest(BaseModel):
    session_id: str
    question: Optional[str] = ""
    answer: str
    rating: str  # 'up' or 'down'
    comment: Optional[str] = ""
    sources: Optional[List[str]] = []


class FeedbackResponse(BaseModel):
    id:str
    session_id: str
    question: Optional[str] = ""
    answer: str
    rating: str  # 'up' or 'down'
    comment: Optional[str] = ""
    sources: Optional[List[str]] = []
    timestamp: datetime
    approved: Optional[str] = "pending"

    class Config:
        orm_mode=True

def create_access_token(data: dict, expires_delta=None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGO)

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())

def authenticate_user(email: str, password: str):
    user = users_db.get(email)
    if not user:
        return False
    if not verify_password(password, user["hashed_password"]):
        return False
    return True

@app.post("/login")
async def login(data: LoginModel , response:Response):
    if not authenticate_user(data.email, data.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": data.email}, timedelta(minutes=ACCESS_TIME))
    response.headers["Cache-Control"] = "no-store"
    return {"access_token": token, "token_type": "bearer"}

@app.get("/protected")
async def protected(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGO])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"message": f"Welcome {email}"}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.post("/ask")
def ask_question(data:AskRequest):
    answer,sources = generate_answer(data.question,session_id=data.session_id)
    return{
        "answer":answer,
        "sources":sources
    }


@app.post("/feedback")
def save_feedback(data:FeedbackRequest,db:Session = Depends(get_db)):
    try:
        feedback = Feedback(
            session_id = data.session_id,
            question = data.question,
            answer = data.answer,
            rating = data.rating,
            comment = data.comment,
            sources = data.sources,
            timestamp = datetime.now()
        )
        db.add(feedback)
        db.commit()
        return{"status":"ok","message":"Feedback saved"}
    except Exception as e:
        db.rollback()
        return{"status":"ok","message":str(e)}



@app.patch("/feedback/{feedback_id}")
def update_feedback_status(feedback_id: str, status: str, db: Session = Depends(get_db)):
    if status not in ["approved", "rejected", "pending"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    feedback.approved = status
    db.commit()
    return {"status": "success", "message": f"Feedback {status}"}


@app.get("/feedbacks",response_model=List[FeedbackResponse])
def get_feedbacks(db:Session = Depends(get_db)):
    feedbacks = db.query(Feedback).order_by(Feedback.timestamp.desc()).all()
    return feedbacks

@app.get("/refresh-docs")
def refresh_docs():
    refresh_if_updated()
    return{"status":"refresh complete"}

@app.get("/feedback-stats")
def get_feedback_stats(db: Session = Depends(get_db)):
    feedbacks = db.query(Feedback).all()

    # Basic counts
    total = len(feedbacks)
    positives = [f for f in feedbacks if f.rating == 'up']
    negatives = [f for f in feedbacks if f.rating == 'down']

    # Most flagged questions
    flagged_qs = [f.question for f in negatives if f.question]
    most_flagged = Counter(flagged_qs).most_common(3)
    most_flagged_questions = [q for q, _ in most_flagged]

    approved = [f for f in feedbacks if f.approved == 'approved']
    rejected = [f for f in feedbacks if f.approved == 'rejected']
    pending = [f for f in feedbacks if f.approved == 'pending']

    # Most negative sources
    bad_sources = []
    for f in negatives:
        if f.sources:
            bad_sources.extend(f.sources)
    top_sources = Counter(bad_sources).most_common(3)
    top_negative_sources = [s for s, _ in top_sources]

    # Accuracy stats
    answered = sum(1 for f in feedbacks if f.answer and f.answer.strip().lower() != "i don't know.")
    accuracy_percent = round((answered / total) * 100, 2) if total else 0

    # Feedback trends over time
    trend_rows = (
        db.query(
            func.date(Feedback.timestamp).label("date"),
            func.count().label("total"),
            func.sum(case((Feedback.rating == "up", 1), else_=0)).label("positive"),
            func.sum(case((Feedback.rating == "down", 1), else_=0)).label("negative"),
        )
        .group_by(func.date(Feedback.timestamp))
        .order_by(func.date(Feedback.timestamp))
        .all()
    )

    feedback_trends = [
        {
            "date": str(row.date),
            "total": int(row.total),
            "positive": int(row.positive or 0),
            "negative": int(row.negative or 0)
        }
        for row in trend_rows
    ]

    # Problematic chunks
    neg_feedback = (
        db.query(Feedback.sources)
        .filter(Feedback.rating == "down")
        .all()
    )

    source_counter = Counter()
    for row in neg_feedback:
        if row.sources:
            source_counter.update(row.sources)

    problematic_chunks = [
        {"source": src, "flags": count}
        for src, count in source_counter.most_common(10)
    ]

    return {
        "total_feedbacks": total,
        "positive_feedbacks": len(positives),
        "negative_feedbacks": len(negatives),
        "positive_percentage": round((len(positives) / total) * 100, 2) if total else 0,
        "most_flagged_questions": most_flagged_questions,
        "top_negative_sources": top_negative_sources,
        "accuracy_percent": accuracy_percent,
        "feedback_trends": feedback_trends,
        "problematic_chunks": problematic_chunks,
        "approved_feedbacks": len(approved),
        "rejected_feedbacks": len(rejected),
        "pending_feedbacks": len(pending)
    }




@app.get("/export-feedback")
def export_feedback(format: str = "csv", db: Session = Depends(get_db)):
    feedbacks = db.query(Feedback).all()

    if format == "csv":
        def generate_csv():
            output = StringIO()
            writer = csv.writer(output)
            writer.writerow(["session_id", "question", "answer", "rating", "comment", "sources", "timestamp"])
            for f in feedbacks:
                writer.writerow([
                    f.session_id,
                    f.question,
                    f.answer,
                    f.rating,
                    f.comment,
                    ", ".join(f.sources) if f.sources else "",
                    f.timestamp
                ])
            output.seek(0)
            yield output.read()

        return StreamingResponse(generate_csv(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=feedback.csv"})

    elif format == "json":
        return JSONResponse(content=[{
            "session_id": f.session_id,
            "question": f.question,
            "answer": f.answer,
            "rating": f.rating,
            "comment": f.comment,
            "sources": f.sources,
            "timestamp": f.timestamp.isoformat()
        } for f in feedbacks])

    return JSONResponse(content={"error": "Unsupported format"}, status_code=400)



@app.get("/source-stats")
def get_source_stats(db:Session=Depends(get_db)):
    stats = (
        db.query(
            Feedback.sources,
            func.count().label("total"),
            func.sum(case((Feedback.rating == "up",1),else_=0)).label("positive"),
            func.sum(case((Feedback.rating == "down",1),else_=0)).label("negative")
        )
        .group_by(Feedback.sources)
        .all()
    )

    result =[]
    for s in stats:
        positive_percent = round((s.positive/s.total)*100,2) if s.total else 0
        result.append({
            "source": s.sources,
            "total": s.total,
            "positive": s.positive,
            "negative": s.negative,
            "positive_percent": positive_percent,
            "score": s.positive - s.negative  
        })

    return JSONResponse(content=result)


if __name__  == "__main__":
    uvicorn.run("main:app",host="127.0.0.1",port=8000,reload=True)