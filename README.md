# Padee

**Padee** helps school children turn textbook pages into printable practice worksheets and question papers.

Supports **CBSE**, **ICSE**, and **Matriculation** boards for **Grades 1–8**, with three levels: **Easy**, **Medium**, and **Difficult**.

## What it does

1. Choose board, grade, subject, difficulty, and worksheet vs question-paper format  
2. Capture or upload textbook page photos (OCR extracts the lesson text)  
3. Generate framed questions from that content  
4. Preview, show an answer key, and **print / save as PDF** (A4)

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

On the create flow you can use **Try demo lesson** if you do not have textbook photos handy.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS  
- [Tesseract.js](https://tesseract.projectnaptha.com/) for in-browser OCR  
- Client-side question framing (fill-ups, MCQ, true/false, short & long answers, match)

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Start development server |
| `npm run build`| Production build         |
| `npm run start`| Run production server    |
| `npm run lint` | Lint the project         |

## Tips for best results

- Photograph pages in good light, flat and in focus  
- One lesson section at a time works better than many cluttered pages  
- Edit the extracted text before generating if OCR misreads a word  

Built for parents and teachers who want quick, printable practice from the books children already use.
