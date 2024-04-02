// ExportToExcel.tsx
import React from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@mui/material';

interface ExportToExcelProps {
  history: Record<string, string>;
}

const ExportToExcel: React.FC<ExportToExcelProps> = ({ history }) => {
  const exportToExcel = () => {
    const historyArray = Object.entries(history).map(([word, definition]) => ({
      Palavra: word,
      Definição: definition.replace(/<[^>]+>/g, ''), // Limpa as tags HTML
    }));

    const ws = XLSX.utils.json_to_sheet(historyArray);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Histórico");
    XLSX.writeFile(wb, "historico_de_traducoes.xlsx");
  };

  return (
    <Button onClick={exportToExcel} variant="contained" color="primary">
      Exportar para Excel
    </Button>
  );
};

export default ExportToExcel;
