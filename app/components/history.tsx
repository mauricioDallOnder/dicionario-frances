"use client"
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableRow, Typography, Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ExportToExcel from './ExportToExcel';
type HistoryType = Record<string, string>;
type HistoryComponentProps = {
  onSelectWord: (word: string, translation: string) => void;
};

export default function HistoryComponent({ onSelectWord }: HistoryComponentProps) {
  const [history, setHistory] = useState<HistoryType>({});

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`https://flask-hello-world-jet-kappa-11.vercel.app/api/history`);
      setHistory(response.data);
    } catch (error) {
      console.error('Erro ao buscar o histórico:', error);
    }
  };

  const handleDeleteWord = async (word: string) => {
    try {
      await axios.delete(`https://flask-hello-world-jet-kappa-11.vercel.app/api/history/${word}`);
      fetchHistory(); // Atualizar o histórico após deletar a palavra
    } catch (error) {
      console.error('Erro ao deletar palavra:', error);
    }
  };

 


  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Histórico de Traduções
      </Typography>
      
      <TableContainer component={Paper}>
        <Table aria-label="simple table">
          <TableBody>
            {Object.entries(history).map(([word, translation]) => (
              <TableRow key={word} hover sx={{ cursor: 'pointer' }}>
                <TableCell onClick={() => onSelectWord(word, translation)} component="th" scope="row">
                  {word}
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleDeleteWord(word)}>
                    <DeleteIcon color="error" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
     
    </Paper>
  );
}
//<ExportToExcel history={history} />
