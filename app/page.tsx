'use client'
import React, { ChangeEvent, useState } from "react";
import axios from "axios";
import DOMPurify from "dompurify";
import { TextField, Button, Container, Typography, Box, Grid, Paper } from "@mui/material";
import Header from "./components/Header";
import HistoryComponent from "./components/history";

export default function Home() {
  const [word, setWord] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [showTranslation, setShowTranslation] = useState(false);
  const [translation, setTranslation] = useState("");

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setWord(event.target.value);
  };

  const fetchTranslation = async (selectedWord: string) => {
    try {
      const response = await axios.get(`https://flask-hello-world-jet-kappa-11.vercel.app/api/definitions?word=${encodeURIComponent(selectedWord)}`);
      setOriginalText(response.data.definition);
      setShowTranslation(false);
    } catch (error) {
      console.error("Falha ao buscar a definição:", error);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    fetchTranslation(word);
  };

  const handleSelectWordFromHistory = (selectedWord: string) => {
    setWord(selectedWord);
    fetchTranslation(selectedWord); // Isto irá buscar a definição da palavra selecionada do histórico
  };

  const translateText = async () => {
    try {
      const response = await axios.post(`https://flask-hello-world-jet-kappa-11.vercel.app/api/translate`, { text: originalText });
      setTranslation(DOMPurify.sanitize(response.data.translation));
      setShowTranslation(!showTranslation);
    } catch (error) {
      console.error("Erro ao traduzir texto:", error);
    }
  };

  return (
     <>
      <Header />
      <Container component="main" maxWidth="lg">
        <Grid container spacing={2} direction={{ xs: 'column-reverse', md: 'row' }}>
          <Grid item xs={12} md={4}>
            <HistoryComponent onSelectWord={handleSelectWordFromHistory} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 2, marginBottom: 2 }}>
              <Typography variant="h6" gutterBottom>
                Buscar uma Palavra:
              </Typography>
              <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
                <TextField
                  id="wordInput"
                  label="Digite uma palavra"
                  variant="outlined"
                  value={word}
                  onChange={handleInputChange}
                  fullWidth
                />
                <Button type="submit" variant="contained" color="primary">
                  Buscar
                </Button>
              </form>
            </Paper>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {showTranslation ? 'Tradução para o Português:' : 'Texto Original em Francês:'}
              </Typography>
              <Box
                dangerouslySetInnerHTML={{ __html: showTranslation ? translation : originalText }}
                 sx={{
                  border: "1px solid #ccc",
                  padding: "20px",
                  borderRadius: "4px",
                  bgcolor: "grey.100",
                  typography: "body1",
                  '& h2': {
                    typography: "h6",
                    color: "secondary.main",
                  },
                  '& p': {
                    marginBottom: "0.5rem",
                  },
                  '& ul, & ol': {
                    listStyleType: 'none',
                    paddingLeft: '20px',
                    '& li': {
                      paddingTop: "0.25rem",
                      paddingBottom: "0.25rem",
                    },
                  },
                  '& .AdresseDefinition': {
                    fontWeight: 'bold',
                  },
                  '& a': {
                    color: "black",
                    textDecoration: "none",
                    '&:hover': {
                       color: "black",
                    },
                  },
                }}
              />
              
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
