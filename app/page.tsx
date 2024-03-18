"use client";
import React, { ChangeEvent, useState, useEffect } from "react";
import axios from "axios";
import DOMPurify from "dompurify";

import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Grid,
  Paper,
} from "@mui/material";
import Header from "./components/Header";
import HistoryComponent from "./components/history";

export default function Home() {
  const [word, setWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [showTranslation, setShowTranslation] = useState(false); // true para mostrar tradução, false para texto original

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setWord(event.target.value);
  };

  const fetchTranslation = async (selectedWord: string) => {
    try {
      const response = await axios.get(
        `https://flask-hello-world-jet-kappa-11.vercel.app/api/definitions?word=${encodeURIComponent(
          selectedWord
        )}`
      );
      setOriginalText(response.data.definition);
      setShowTranslation(false); // Mostrar texto original por padrão
    } catch (error) {
      console.error("Falha ao buscar a definição:", error);
    }
  };

  const translateText = async () => {
    if (!showTranslation) {
      // Se não estiver mostrando a tradução, traduzir
      try {
        const response = await axios.post(
          `https://flask-hello-world-jet-kappa-11.vercel.app/api/translate`,
          { text: originalText }
        );
        setTranslation(DOMPurify.sanitize(response.data.translation));
      } catch (error) {
        console.error("Erro ao traduzir texto:", error);
      }
    }
    setShowTranslation(!showTranslation); // Alternar a exibição entre original e tradução
  };

  const handleSelectWordFromHistory = (selectedWord: string) => {
    setWord(selectedWord);
    fetchTranslation(selectedWord);
  };

  useEffect(() => {
    if (word) {
      fetchTranslation(word);
    }
  }, [word]);

  return (
    <>
      <Header />
      <Container component="main" maxWidth="lg">
        <Grid container spacing={3}>
          
          <Grid item xs={12} md={9}>
            <Paper elevation={3} sx={{ p: 2, marginBottom: 2 }}>
              <Typography variant="h6" gutterBottom>
                Traduzir Palavra:
              </Typography>
              <TextField
                id="wordInput"
                label="Digite uma palavra"
                variant="outlined"
                fullWidth
                value={word}
                onChange={handleInputChange}
              />
              <Button
                onClick={() => fetchTranslation(word)}
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
              >
                Buscar
              </Button>
            </Paper>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Box sx={{display:"flex",alignItems:"baseline", justifyContent:"space-around"}}>
              <Typography variant="h6" gutterBottom>
                {showTranslation
                  ? "Tradução para o Português:"
                  : "Texto Original em Francês:"}
              </Typography>
              <Button
                onClick={translateText}
                variant="contained"
                color="secondary"
                sx={{ mt: 2 }}
              >
                {showTranslation
                  ? "Mostrar Original em Francês"
                  : "Traduzir para o Português"}
              </Button>
              </Box>
              <Box
                dangerouslySetInnerHTML={{
                  __html: showTranslation ? translation : originalText,
                }}
                sx={{
                  border: "1px solid #ccc",
                  padding: "20px",
                  borderRadius: "4px",
                  bgcolor: "grey.100",
                  typography: "body1",
                  '& h2': { // Estilizando as tags h2
                    typography: "h6",
                    color: "secondary.main",
                  },
                  '& p': { // Estilizando parágrafos
                    marginBottom: "0.5rem",
                  },
                  '& ul, & ol': { // Estilizando listas
                    listStyleType: 'none',
                    paddingLeft: '20px',
                    '& li': { // Estilizando itens de lista
                      paddingTop: "0.25rem",
                      paddingBottom: "0.25rem",
                      paddingLeft: 0,
                    },
                  },
                  '& .AdresseDefinition': { // Estilizando elementos com a classe específica
                    fontWeight: 'bold',
                  },
                  '& a': { // Estilizando links
                    color: "primary.main",
                    textDecoration: "none",
                    '&:hover': {
                      textDecoration: "underline",
                    
                    },
                  },
                  
                 
                  
                }}
              />
              
            </Paper>
           
          </Grid>
           <Grid item xs={12} md={3}>
            <HistoryComponent onSelectWord={handleSelectWordFromHistory} />
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
