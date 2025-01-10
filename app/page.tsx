'use client'
import React, { ChangeEvent, useState, useEffect } from "react";
import axios from "axios";
import DOMPurify from "dompurify";
import { TextField, Button, Container, Typography, Box, Grid, Paper } from "@mui/material";
import Header from "./components/Header";
import HistoryComponent from "./components/history";

function parseDefinitions(htmlString: string): Array<string> {
  // DOMParser é do browser (não funciona no Node)
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  const lis = Array.from(doc.querySelectorAll("li.DivisionDefinition"));
  return lis.map(li => li.outerHTML);
}

export default function Home() {
  const [word, setWord] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [showTranslation, setShowTranslation] = useState(false);
  const [translation, setTranslation] = useState("");
  const [definitionList, setDefinitionList] = useState<string[]>([]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setWord(event.target.value);
  };

  const fetchTranslation = async (selectedWord: string) => {
    try {
      const response = await axios.get(`https://flask-hello-world-jet-kappa-11.vercel.app/api/definitions?word=${encodeURIComponent(selectedWord)}`);
      const sanitizedHtml = DOMPurify.sanitize(response.data.definition);
      setOriginalText(sanitizedHtml);
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
    fetchTranslation(selectedWord);
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

  // Sempre que originalText mudar, extraímos a lista de definições
  useEffect(() => {
    if (originalText) {
      const definitions = parseDefinitions(originalText);
      setDefinitionList(definitions);
    } else {
      setDefinitionList([]);
    }
  }, [originalText]);

  return (
    <>
      <Header />
      <Container component="main" maxWidth="lg">
        <Grid container spacing={2} direction={{ xs: 'column-reverse', md: 'row' }}>
          <Grid item xs={12} md={4}>
            <HistoryComponent onSelectWord={handleSelectWordFromHistory} />
          </Grid>
          <Grid item xs={12} md={8}>
            {/* Buscar Palavra */}
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

            {/* Botão de traduzir */}
            <Box sx={{ marginBottom: 2 }}>
              {originalText && (
                <Button variant="contained" onClick={translateText} color={showTranslation ? 'secondary' : 'primary'}>
                  {showTranslation ? 'Ver Original' : 'Traduzir'}
                </Button>
              )}
            </Box>

            {/* Se estiver mostrando a tradução, exibe a tradução inteira em um box,
                caso contrário, mostra as divisões formatadas */}
            {showTranslation ? (
              <Paper elevation={3} sx={{ p: 2, marginBottom: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Tradução para o Português:
                </Typography>
                <Box
                  dangerouslySetInnerHTML={{ __html: translation }}
                  sx={{
                    border: "1px solid #ccc",
                    padding: "20px",
                    borderRadius: "4px",
                    bgcolor: "grey.100",
                    typography: "body1",
                  }}
                />
              </Paper>
            ) : (
              <>
                {/* Texto completo com tags originais, caso queira ver a estrutura inteira */}
                <Paper elevation={3} sx={{ p: 2, marginBottom: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Texto Original em Francês (completo):
                  </Typography>
                  <Box
                    dangerouslySetInnerHTML={{ __html: originalText }}
                    sx={{
                      border: "1px solid #ccc",
                      padding: "20px",
                      borderRadius: "4px",
                      bgcolor: "grey.100",
                      typography: "body1",
                      "& h2": {
                        typography: "h6",
                        color: "secondary.main",
                      },
                      "& p": {
                        marginBottom: "0.5rem",
                      },
                      "& ul, & ol": {
                        listStyleType: 'none',
                        paddingLeft: '20px',
                        "& li": {
                          paddingTop: "0.25rem",
                          paddingBottom: "0.25rem",
                        },
                      },
                      "& .AdresseDefinition": {
                        fontWeight: 'bold',
                      },
                      "& a": {
                        color: "black",
                        textDecoration: "none",
                        '&:hover': {
                          color: "black",
                        },
                      },
                    }}
                  />
                </Paper>

                {/* Lista das definições separadas */}
                {definitionList.length > 0 && (
                  <Paper elevation={3} sx={{ p: 2, marginBottom: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Definições encontradas (separadas):
                    </Typography>
                    {definitionList.map((definitionHTML, index) => (
                      <Paper
                        key={index}
                        elevation={1}
                        sx={{
                          p: 2,
                          mb: 2,
                          "& li.DivisionDefinition": {
                            marginBottom: 0,
                            borderLeft: "4px solid #1976d2",
                            paddingLeft: "0.5rem",
                          },
                        }}
                      >
                        {/* Colocamos cada li.DivisionDefinition dentro de Box */}
                        <Box
                          dangerouslySetInnerHTML={{ __html: definitionHTML }}
                        />
                      </Paper>
                    ))}
                  </Paper>
                )}
              </>
            )}
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
