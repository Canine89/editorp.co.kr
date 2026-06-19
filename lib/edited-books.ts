import fs from 'fs';
import path from 'path';

export interface EditedBook {
  title: string;
  role: string;
  url: string;
  image: string;
  note?: string;
}

export interface EditedBookPublisher {
  id: string;
  name: string;
  period: string;
  color: string;
  books: EditedBook[];
}

export interface EditedBooksData {
  publishers: EditedBookPublisher[];
}

const DATA_PATH = path.join(process.cwd(), 'data', 'edited-books.json');

export function getEditedBooksData(): EditedBooksData {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  return JSON.parse(raw) as EditedBooksData;
}

export function countEditedBooks(data: EditedBooksData): number {
  return data.publishers.reduce((sum, pub) => sum + pub.books.length, 0);
}
