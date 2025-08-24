// /app/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import DOMPurify from "dompurify";
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
} from "@mui/material";

// Importe seus componentes, incluindo o novo AutocompleteSearch
import Header from "./components/Header";
import HistoryComponent from "./components/history";
import AutocompleteSearch from "./components/AutocompleteSearch"; // <-- NOVA IMPORTAÇÃO

// --- Nenhuma alteração nas interfaces (ParsedHeader, ParsedDefinition) ---
interface ParsedHeader {
  title: string;
  catGram: string;
  origin: string;
}
interface ParsedDefinition {
  numDef: string;
  mainText: string;
  example?: string;
  synonyms?: string;
  contraries?: string;
}

// --- Nenhuma alteração nas funções de parsing (parseHeader, parseDefinitionItem, parseHtmlFromLarousse) ---
function parseHeader(doc: Document): ParsedHeader {
  // ...código original sem alterações...
  const result: ParsedHeader = {
    title: "",
    catGram: "",
    origin: "",
  };

  const titleEl = doc.querySelector("h2.AdresseDefinition");
  if (titleEl) {
    result.title = titleEl.textContent?.trim() || "";
  }

  const catEl = doc.querySelector("p.CatgramDefinition");
  if (catEl) {
    result.catGram = catEl.textContent?.trim() || "";
  }

  const origEl = doc.querySelector("p.OrigineDefinition");
  if (origEl) {
    result.origin = origEl.textContent?.trim() || "";
  }

  return result;
}
function parseDefinitionItem(li: HTMLLIElement): ParsedDefinition {
  // ...código original sem alterações...
  const result: ParsedDefinition = {
    numDef: "",
    mainText: "",
  };

  const numSpan = li.querySelector("span.numDef");
  if (numSpan) {
    result.numDef = numSpan.textContent?.trim() || "";
  }

  const liClone = li.cloneNode(true) as HTMLLIElement;

  const spanDefClone = liClone.querySelector("span.numDef");
  if (spanDefClone) {
    spanDefClone.remove();
  }

  const exampleSpan = liClone.querySelector("span.ExempleDefinition");
  if (exampleSpan) {
    result.example = exampleSpan.textContent?.trim() || "";
    exampleSpan.remove();
  }
  
  const libelleList = Array.from(liClone.querySelectorAll("p.LibelleSynonyme"));
  libelleList.forEach((p) => {
    const label = p.textContent?.toLowerCase() || "";
    const next = p.nextElementSibling as HTMLElement | null;
    if (next && next.classList.contains("Synonymes")) {
      const textValue = next.textContent?.trim() || "";
      if (label.includes("synonym")) {
        result.synonyms = (result.synonyms || "") + textValue;
      }
      else if (label.includes("contrair")) {
        result.contraries = (result.contraries || "") + textValue;
      }
      next.remove();
    }
    p.remove();
  });
  result.mainText = liClone.textContent?.trim() || "";

  return result;
}
function parseHtmlFromLarousse(htmlString: string, maxDefs = 2) {
  // ...código original sem alterações...
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  const header = parseHeader(doc);
  const liElements = Array.from(
    doc.querySelectorAll("li.DivisionDefinition")
  ) as HTMLLIElement[];
  const sliced = liElements.slice(0, maxDefs);
  const parsedDefs = sliced.map(parseDefinitionItem);

  return { header, definitions: parsedDefs };
}


/**
 * Componente principal
 */
export default function Home() {
  const [word, setWord] = useState(""); // Mantemos este estado para saber a palavra atual
  const [rawHtml, setRawHtml] = useState("");
  const [header, setHeader] = useState<ParsedHeader>({
    title: "",
    catGram: "",
    origin: "",
  });
  const [definitions, setDefinitions] = useState<ParsedDefinition[]>([]);
  
  // A função handleInputChange não é mais necessária aqui
  // const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
  //   setWord(event.target.value);
  // };

  const fetchDefinition = async (selectedWord: string) => {
    if (!selectedWord) return; // Não busca se a palavra estiver vazia
    setWord(selectedWord); // Atualiza o estado da palavra atual
    try {
      const response = await axios.get(
        `https://flask-hello-world-jet-kappa-11.vercel.app/api/definitions?word=${encodeURIComponent(selectedWord)}`
      );
      const sanitizedHtml = DOMPurify.sanitize(response.data.definition);
      setRawHtml(sanitizedHtml);
    } catch (error) {
      console.error("Falha ao buscar a definição:", error);
    }
  };

  // A função handleSubmit foi movida para o componente AutocompleteSearch
  // Agora temos uma função que é passada como prop para o componente filho
  const handleSearch = (searchedWord: string) => {
    fetchDefinition(searchedWord);
  };

  // Esta função continua a mesma
  const handleSelectWordFromHistory = (selectedWord: string) => {
    fetchDefinition(selectedWord);
  };

  useEffect(() => {
    if (rawHtml) {
      const { header: hd, definitions: defs } = parseHtmlFromLarousse(rawHtml, 2);
      setHeader(hd);
      setDefinitions(defs);
    } else {
      setHeader({ title: "", catGram: "", origin: "" });
      setDefinitions([]);
    }
  }, [rawHtml]);

  return (
    <>
      <Header />
      <Container component="main" maxWidth="lg">
        <Grid container spacing={2} direction={{ xs: "column-reverse", md: "row" }}>
          <Grid item xs={12} md={4}>
            <HistoryComponent onSelectWord={handleSelectWordFromHistory} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Buscar uma Palavra:
              </Typography>
              {/* ===== ÁREA MODIFICADA ===== */}
              {/* Substituímos o <form> antigo pelo novo componente */}
              <AutocompleteSearch onSearch={handleSearch} />
              {/* =========================== */}
            </Paper>

            {/* O resto do código para exibir os resultados permanece o mesmo */}
            {(header.title || definitions.length > 0) && (
              <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                {header.title && (
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ fontWeight: "bold", color: "#333" }}
                  >
                    {header.title}
                  </Typography>
                )}
                {header.catGram && (
                  <Typography variant="h6" gutterBottom sx={{ color: "#555" }}>
                    {header.catGram}
                  </Typography>
                )}
                {header.origin && (
                  <Typography
                    variant="body1"
                    gutterBottom
                    sx={{ fontSize: "1.1rem", fontStyle: "italic" }}
                  >
                    {header.origin}
                  </Typography>
                )}
                {definitions.map((defItem, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      mt: 3,
                      p: 2,
                      borderLeft: "4px solid #1976d2",
                      backgroundColor: "#fefefe",
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{ fontSize: "1.15rem", fontWeight: "bold", mb: 1 }}
                    >
                      {defItem.numDef} {defItem.mainText}
                    </Typography>
                    {defItem.example && (
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>Example:</strong> {defItem.example}
                      </Typography>
                    )}
                    {defItem.synonyms && (
                      <Typography
                        variant="body1"
                        sx={{ mb: 1, color: "green", fontWeight: "bold" }}
                      >
                        Synonyme: {defItem.synonyms}
                      </Typography>
                    )}
                    {defItem.contraries && (
                      <Typography
                        variant="body1"
                        sx={{ mb: 1, color: "red", fontWeight: "bold" }}
                      >
                        Contraires: {defItem.contraries}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Paper>
            )}
            {rawHtml && !header.title && definitions.length === 0 && (
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="body1" sx={{ color: "red" }}>
                  Aucun résultat trouvé ou não foi possível extrair definições.
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Container>
    </>
  );
}