import React from "react";
import "../Styles/Pagination.css";

export const PAGE_SIZE = 30;

export default function Pagination({ currentPage, onPageChange, totalItems }) {
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  if (totalPages <= 1) return null;

  const firstVisiblePage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const lastVisiblePage = Math.min(totalPages, firstVisiblePage + 4);
  const firstItem = (currentPage - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(currentPage * PAGE_SIZE, totalItems);

  return (
    <nav className="listPagination" aria-label="Paginación de resultados">
      <span className="listPaginationSummary">Mostrando {firstItem}-{lastItem} de {totalItems}</span>
      <div className="listPaginationControls">
        <button
          type="button"
          className="listPaginationButton"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Página anterior"
        >
          Anterior
        </button>
        {firstVisiblePage > 1 && (
          <>
            <button type="button" className="listPaginationButton" onClick={() => onPageChange(1)}>1</button>
            {firstVisiblePage > 2 && <span className="listPaginationEllipsis" aria-hidden="true">…</span>}
          </>
        )}
        {Array.from({ length: lastVisiblePage - firstVisiblePage + 1 }, (_, index) => {
          const page = firstVisiblePage + index;
          return (
            <button
              type="button"
              key={page}
              className={`listPaginationButton ${page === currentPage ? "listPaginationButtonActive" : ""}`}
              onClick={() => onPageChange(page)}
              aria-current={page === currentPage ? "page" : undefined}
              aria-label={`Página ${page}`}
            >
              {page}
            </button>
          );
        })}
        {lastVisiblePage < totalPages && (
          <>
            {lastVisiblePage < totalPages - 1 && <span className="listPaginationEllipsis" aria-hidden="true">…</span>}
            <button type="button" className="listPaginationButton" onClick={() => onPageChange(totalPages)}>{totalPages}</button>
          </>
        )}
        <button
          type="button"
          className="listPaginationButton"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Página siguiente"
        >
          Siguiente
        </button>
      </div>
    </nav>
  );
}
