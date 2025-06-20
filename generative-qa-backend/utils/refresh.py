import os
import json
import hashlib
from pathlib import Path
from datetime import datetime
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import Chroma

HASH_DB = "source_hashes.json"
DOCS_DIR = "data/docs"
DB_DIR = "db"

def calculate_file_hash(file_path):
    with open(file_path,"rb")as f:
        return hashlib.sha256(f.read()).hexdigest()
    
def get_stored_hashes():
    if not os.path.exists(HASH_DB):
        return{}
    with open(HASH_DB,"r")as f:
        return json.load(f)
    
def save_hashes(hashes):
    with open(HASH_DB,"w") as f:
        json.dump(hashes,f)

def refresh_if_updated():
    stored_hashes = get_stored_hashes()
    current_hashes = {}
    updated_files=[]

    for file in Path(DOCS_DIR).glob("*txt"):
        file_hash = calculate_file_hash(file)
        current_hashes[file.name] = file_hash

        if file.name not in stored_hashes or stored_hashes[file.name] != file_hash:
            print(f"File changed or new :{file.name}")
            updated_files.append(str(file))
    
    if updated_files:
        refresh_embeddings(updated_files)
        save_hashes(current_hashes)

def refresh_embeddings(file_list):
    splitter = CharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    db = Chroma(persist_directory=DB_DIR, embedding_function=embeddings)

    for file_path in file_list:
        loader = TextLoader(file_path, encoding="utf-8")
        docs = loader.load()

        # ✅ Assign metadata['source'] as just filename (important for deletion)
        for doc in docs:
            doc.metadata["source"] = Path(file_path).name

        docs = splitter.split_documents(docs)

        # ✅ DELETE old vectors for this source
        db.delete(where={"source": Path(file_path).name})

        # ✅ Add new vectors
        db.add_documents(docs)
        db.persist()

        print(f"✅ Refreshed: {file_path}")