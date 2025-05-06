# convert_pdf_to_docx.py
import sys
from pdf2docx import Converter

def convert_pdf_to_docx(input_pdf, output_docx):
    cv = Converter(input_pdf)
    cv.convert(output_docx, start=0, end=None)
    cv.close()

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python convert_pdf_to_docx.py input.pdf output.docx")
        sys.exit(1)
    
    input_pdf = sys.argv[1]
    output_docx = sys.argv[2]

    convert_pdf_to_docx(input_pdf, output_docx)
