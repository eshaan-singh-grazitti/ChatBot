from sqlalchemy import Column,String,Text,DateTime
from sqlalchemy.dialects.sqlite import JSON
from uuid import uuid4
from datetime import datetime
from database import Base

class Feedback(Base):
    __tablename__="feedback"

    id = Column(String,primary_key=True,default=lambda:str(uuid4()))
    session_id = Column(String,nullable=False)
    question = Column(Text,nullable=True)
    answer = Column(Text,nullable=False)
    rating = Column(String,nullable=False)
    comment = Column(Text,nullable=True)
    sources = Column(JSON,nullable=True)
    timestamp = Column(DateTime,default=datetime.now)
    approved = Column(String,default="pending")
