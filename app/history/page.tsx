'use client'
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

interface HistoryComponentProps {
  onSelectWord: (word: string, translation: string) => void;
}

// tipo para o histórico: um objeto com chaves e valores do tipo string
type HistoryType = Record<string, string>;

export default function HistoryComponent({ onSelectWord }: HistoryComponentProps) {
  const [history, setHistory] = useState<HistoryType>({});

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5328/api/history');
      setHistory(response.data);
    } catch (error) {
      console.error('Erro ao buscar o histórico:', error);
    }
  };

  const handleDeleteWord = async (word: string) => {
    try {
      await axios.delete(`http://127.0.0.1:5328/api/history/${word}`);
      fetchHistory(); // Refresh history after deleting a word
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
};



