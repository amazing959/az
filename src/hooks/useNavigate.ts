import { useState, useEffect } from 'react';

export type Page = 'home' | 'login' | 'register' | 'admin' | 'farmer';

let currentPage: Page = 'home';
let listeners: Array<(page: Page) => void> = [];

export function useNavigate() {
  const [, setPage] = useState<Page>(currentPage);

  useEffect(() => {
    const listener = (page: Page) => setPage(page);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  const navigate = (page: Page) => {
    currentPage = page;
    listeners.forEach((listener) => listener(page));
  };

  return navigate;
}

export function usePage() {
  const [page, setPage] = useState<Page>(currentPage);

  useEffect(() => {
    const listener = (newPage: Page) => setPage(newPage);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  return page;
}
