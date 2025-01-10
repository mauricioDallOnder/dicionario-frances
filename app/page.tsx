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
  Paper,
} from "@mui/material";
import Header from "./components/Header";
import HistoryComponent from "./components/history";

interface ParsedDefinition {
  numDef: string;
  mainText: string;
  example?: string;
  synonyms?: string;
  contraries?: string;
}

function parseDefinitionItem(li: HTMLLIElement): ParsedDefinition {
  const result: ParsedDefinition = {
    numDef: "",
    mainText: "",
    example: undefined,
    synonyms: undefined,
    contraries: undefined,
  };

  // Pegar número da definição
  const numSpan = li.querySelector("span.numDef");
  if (numSpan) {
    result.numDef = numSpan.textContent?.trim() || "";
  }

  // Remover <span class="numDef"> do clone e obter o texto principal
  const liClone = li.cloneNode(true) as HTMLLIElement;
  const spanDef = liClone.querySelector("span.numDef");
  if (spanDef) spanDef.remove();
  result.mainText = liClone.textContent?.trim() || "";

  // Exemplo
  const exampleSpan = li.querySelector("span.ExempleDefinition");
  if (exampleSpan) {
    result.example = exampleSpan.textContent?.trim() || "";
  }

  // Sinônimos e Contrários
  const libelleList = Array.from(li.querySelectorAll("p.LibelleSynonyme"));
  libelleList.forEach((p) => {
    const label = p.textContent?.toLowerCase().trim() || "";
    if (label.includes("synonym")) {
      const next = p.nextElementSibling as HTMLElement | null;
      if (next && next.classList.contains("Synonymes")) {
        result.synonyms = next.textContent?.trim() || "";
      }
    } else if (label.includes("contrair")) {
      const next = p.nextElementSibling as HTMLElement | null;
      if (next && next.classList.contains("Synonymes")) {
        result.contraries = next.textContent?.trim() || "";
      }
    }
  });

  return result;
}

function parseDefinitions(htmlString: string): ParsedDefinition[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  const liElements = Array.from(
    doc.querySelectorAll("li.DivisionDefinition")
  ) as HTMLLIElement[];
  const firstThree = liElements.slice(0, 3); // pega só até 3
  return firstThree.map((li) => parseDefinitionItem(li));
}

export default function Home() {
  const [word, setWord] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [definitions, setDefinitions] = useState<ParsedDefinition[]>([]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setWord(event.target.value);
  };

  // Buscar definição no backend
  const fetchDefinition = async (selectedWord: string) => {
    try {
      const response = await axios.get(
        `https://flask-hello-world-jet-kappa-11.vercel.app/api/definitions?word=${encodeURIComponent(selectedWord)}`
      );
      const sanitizedHtml = DOMPurify.sanitize(response.data.definition);
      setOriginalText(sanitizedHtml);
    } catch (error) {
      console.error("Falha ao buscar a definição:", error);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    fetchDefinition(word);
  };

  const handleSelectWordFromHistory = (selectedWord: string) => {
    setWord(selectedWord);
    fetchDefinition(selectedWord);
  };

  // Quando originalText mudar, parseamos as definições
  useEffect(() => {
    if (originalText) {
      const parsed = parseDefinitions(originalText);
      setDefinitions(parsed);
    } else {
      setDefinitions([]);
    }
  }, [originalText]);

  return (
    <>
      <Header />
      <Container component="main" maxWidth="lg">
        <Grid container spacing={2} direction={{ xs: "column-reverse", md: "row" }}>
          {/* Histórico */}
          <Grid item xs={12} md={4}>
            <HistoryComponent onSelectWord={handleSelectWordFromHistory} />
          </Grid>

          {/* Conteúdo principal */}
          <Grid item xs={12} md={8}>
            {/* Form de busca */}
            <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Buscar uma Palavra:
              </Typography>
              <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px" }}>
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

            {/* Exibir definições parseadas */}
            {definitions.length > 0 && (
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Definições (máximo 3):
                </Typography>

                {definitions.map((defItem, index) => (
                  <Box
                    key={index}
                    sx={{
                      mb: 3,
                      p: 2,
                      borderLeft: "4px solid #1976d2",
                      backgroundColor: "#fefefe",
                    }}
                  >
                    {/* Linha 1: "2. Appliquer une chose..." */}
                    <Typography variant="body1" sx={{ fontWeight: "bold", mb: 1 }}>
                      {/* Monta "2. Appliquer..." */}
                      {defItem.numDef} {defItem.mainText}
                    </Typography>

                    {/* Linha 2: Example: Appuyer un doigt... (se existir) */}
                    {defItem.example && (
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>Example:</strong> {defItem.example}
                      </Typography>
                    )}

                    {/* Linha 3: Synonyme: ... (se existir) */}
                    {defItem.synonyms && (
                      <Typography variant="body1" sx={{ mb: 1, color: "green" }}>
                        <strong>Synonyme:</strong> {defItem.synonyms}
                      </Typography>
                    )}

                    {/* Linha 4: Contraires: ... (se existir) */}
                    {defItem.contraries && (
                      <Typography variant="body1" sx={{ mb: 1, color: "red" }}>
                        <strong>Contraires:</strong> {defItem.contraries}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Paper>
            )}

            {/* Se não houve definições parseadas e originalText não estiver vazio,
                pode ter sido "Aucun résultat trouvé" ou algo assim */}
            {originalText && definitions.length === 0 && (
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="body1">
                  Nenhuma definição encontrada ou não foi possível parsear.
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
