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
        """Extract and chunk PDF content with location metadata"""
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

            # Format result with location metadata
            result = []
            for i, chunk in enumerate(chunks):
                result.append({
                    "chunk_number": i,
                    "chunk_index": i,
                    "page_number": chunk.metadata.get("page", 0),
                    "text": chunk.page_content,
                    "source": filename,
                    "line_start": None,  # PDF'lerde satır takibi güvenilir değil
                    "line_end": None
                })

            # Cleanup
            os.unlink(tmp_path)

            return result
        except Exception as e:
            raise Exception(f"PDF processing failed: {str(e)}")

    def extract_text_chunks(self, text: str, filename: str) -> List[Dict]:
        """Extract and chunk plain text content with line tracking"""
        try:
            lines = text.split('\n')

            # Split text into chunks
            chunks = self.splitter.split_text(text)

            result = []
            current_line = 0

            for i, chunk_text in enumerate(chunks):
                # Find line_start
                line_start = current_line

                # Count lines in this chunk
                chunk_lines = chunk_text.count('\n')
                line_end = line_start + chunk_lines

                # Track position in original text
                chunk_pos = text.find(chunk_text)
                if chunk_pos >= 0:
                    line_start = text[:chunk_pos].count('\n')
                    line_end = line_start + chunk_lines

                result.append({
                    "chunk_number": i,
                    "chunk_index": i,
                    "page_number": 0,  # TXT: 0 = sayfa yok, line_start/end kullan
                    "text": chunk_text,
                    "source": filename,
                    "line_start": line_start,
                    "line_end": line_end
                })

                current_line = line_end + 1

            return result
        except Exception as e:
            raise Exception(f"Text processing failed: {str(e)}")

pdf_processor = PDFProcessor()
