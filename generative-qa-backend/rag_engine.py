import os
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import Runnable,RunnablePassthrough
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import Chroma
from langchain.chains import RetrievalQA , StuffDocumentsChain
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
from database import SessionLocal
from models import Feedback
from utils.feedback_utils import get_source_feedback_scores
from utils.session_utils import get_session_history
from pathlib import Path
from utils.memory import append_to_session, get_memory_context

load_dotenv()

openai_api_key = os.getenv("OPENAI_API_KEY")

def load_documents():
    all_docs =[]
    for file in Path("data/docs/").glob("*.txt"):
        loader = TextLoader(str(file),encoding="utf-8")
        docs = loader.load()

        for doc in docs:
            doc.metadata["source"] = file.name

        all_docs.extend(docs)
    splitter = CharacterTextSplitter(chunk_size = 800,chunk_overlap=100)
    documents = splitter.split_documents(all_docs)
    return documents

def create_vector_store(docs):
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-mpnet-base-v2"
    )
    if not os.path.exists("db/index"):
        db = Chroma.from_documents(docs, embeddings, persist_directory="db")
    else:
        db = Chroma(persist_directory="db", embedding_function=embeddings)


    return db

def is_vague_question(q: str) -> bool:
    q = q.lower()
    vague_starts = [
        "what are its", "what are their", "how does it", "why is it", "what is its",
        "what about", "how is it", "is it", "where can it", "what are the", "what does it do"
    ]
    return any(q.startswith(start) for start in vague_starts)


def generate_answer(question, session_id=None):
    docs = load_documents()
    db = create_vector_store(docs)
    retriever = db.as_retriever(search_kwargs={"k": 5})

    session = SessionLocal()
    source_scores = get_source_feedback_scores(session)

    def score_with_feedback(doc):
        source = doc.metadata.get("source", "")
        feedback = source_scores.get(source, {"up": 0, "down": 0})
        return feedback["up"] - 1.5 * feedback["down"]

    retrieved_docs = retriever.invoke(question)
    ranked_docs = sorted(retrieved_docs, key=score_with_feedback, reverse=True)
    top_docs = ranked_docs[:3]

    # 🧠 Inject conversation history
    chat_context = ""
    if session_id:
        chat_context = get_memory_context(session_id)

    full_prompt = f"{chat_context}\nUser: {question}"

    llm = ChatOpenAI(
    openai_api_key=openai_api_key,
    model="gpt-4o-mini",
    temperature=0
    )
    prompt = PromptTemplate.from_template(
        "You are a helpful assistant. Use the following context to answer the user's question.\n\n"
        "Context:\n{context}\n\nQuestion:\n{question}\n\nAnswer:"
    )
    chain = create_stuff_documents_chain(llm, prompt)
    result = chain.invoke({"context": top_docs, "question": full_prompt})
    answer = result

    # 🧠 Save current turn to memory
    if session_id:
        append_to_session(session_id, question, answer)

    sources = list(set(Path(doc.metadata.get("source", "unknown")).name for doc in top_docs))
    return answer, sources



