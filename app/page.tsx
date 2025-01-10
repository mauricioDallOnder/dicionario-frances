'use client'
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
  Paper 
} from "@mui/material";
import Header from "./components/Header";
import HistoryComponent from "./components/history";

// 1) Função para extrair até 3 definições do HTML.
function parseDefinitions(htmlString: string): Array<string> {
  // DOMParser (nativo do navegador) converte uma string HTML em Document.
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  
  // Seleciona todas as <li> que tenham a classe "DivisionDefinition".
  const lis = Array.from(doc.querySelectorAll("li.DivisionDefinition"));
  
  // Se quisermos apenas as 3 primeiras definições, podemos fazer um slice(0,3).
  const firstThree = lis.slice(0, 3);
  
  // Retornamos um array contendo o HTML de cada <li> (outerHTML).
  return firstThree.map(li => li.outerHTML);
}

export default function Home() {
  const [word, setWord] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [definitionList, setDefinitionList] = useState<string[]>([]);

  // Quando o usuário digita no campo de input
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setWord(event.target.value);
  };

  // 2) Função para buscar a definição no backend
  const fetchDefinition = async (selectedWord: string) => {
    try {
      // Ajuste a URL abaixo para o seu endpoint real.
      const response = await axios.get(
        `https://flask-hello-world-jet-kappa-11.vercel.app/api/definitions?word=${encodeURIComponent(selectedWord)}`
      );

      // Sanitiza o HTML recebido
      const sanitizedHtml = DOMPurify.sanitize(response.data.definition);

      // Armazena o HTML completo para debug ou exibir como quiser
      setOriginalText(sanitizedHtml);

    } catch (error) {
      console.error("Falha ao buscar a definição:", error);
    }
  };

  // 3) Quando o usuário submete o formulário, chamamos a API
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    fetchDefinition(word);
  };

  // 4) Quando o usuário clica em uma palavra do histórico
  const handleSelectWordFromHistory = (selectedWord: string) => {
    setWord(selectedWord);
    fetchDefinition(selectedWord);
  };

  // 5) Toda vez que `originalText` mudar, vamos extrair até 3 definições
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
        {/* Layout em Grid: menu de histórico à esquerda, conteúdo à direita */}
        <Grid container spacing={2} direction={{ xs: 'column-reverse', md: 'row' }}>
          
          {/* Coluna da esquerda: histórico */}
          <Grid item xs={12} md={4}>
            <HistoryComponent onSelectWord={handleSelectWordFromHistory} />
          </Grid>

          {/* Coluna da direita: buscar palavra e exibir definições */}
          <Grid item xs={12} md={8}>
            
            {/* Formulário de busca */}
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

            {/* Exibir a palavra + definições */}
            {originalText && (
              <Paper elevation={3} sx={{ p: 2, marginBottom: 2 }}>
                {/* Podemos mostrar o título (se existir no HTML) */}
                <Typography variant="h6" gutterBottom>
                  {/* Você pode usar a própria "word" como título, ou extrair do HTML */}
                  Palavra: {word}
                </Typography>
                
                <Typography variant="body1" gutterBottom>
                  (Exibindo o significado principal + 2 significados adicionais, se existirem)
                </Typography>

                {/* Exibição das definições separadas, no estilo "Definições encontradas (separadas):" */}
                {definitionList.map((definitionHTML, index) => (
                  <Paper
                    key={index}
                    elevation={1}
                    sx={{
                      p: 2,
                      mb: 2,
                      "& li.DivisionDefinition": {
                        // aqui você personaliza o estilo de cada li
                        borderLeft: "4px solid #1976d2",
                        paddingLeft: "0.5rem",
                        marginBottom: 0
                      }
                    }}
                  >
                    <Box
                      dangerouslySetInnerHTML={{ __html: definitionHTML }}
                      // Aqui podemos aplicar classes ou estilos para refinar
                      sx={{
                        "& .ExempleDefinition": {
                          fontStyle: "italic",
                          color: "#555",
                        },
                        "& .Synonymes": {
                          fontWeight: "bold",
                          marginTop: "0.5rem",
                        },
                        // etc.
                      }}
                    />
                  </Paper>
                ))}
              </Paper>
            )}
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
