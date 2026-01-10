from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import List, Dict
import tempfile
import os

class PDFProcessor:
    def __init__(self, chunk_size: int = 8000, chunk_overlap: int = 50):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", " ", ""]
        )

    def extract_chunks(self, file_bytes: bytes, filename: str) -> List[Dict]:
        """Extract and chunk PDF content"""
        try:
            # Save to temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                tmp.write(file_bytes)
                tmp_path = tmp.name

            # Load PDF
            loader = PyPDFLoader(tmp_path)
            documents = loader.load()

            # Split into chunks
            chunks = self.splitter.split_documents(documents)

            # Format result
            result = []
            for i, chunk in enumerate(chunks):
                result.append({
                    "chunk_number": i,
                    "page_number": chunk.metadata.get("page", 0),
                    "text": chunk.page_content,
                    "source": filename
                })

            # Cleanup
            os.unlink(tmp_path)

            return result
        except Exception as e:
            raise Exception(f"PDF processing failed: {str(e)}")

pdf_processor = PDFProcessor()
