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

/** Estrutura que iremos montar para cada definição. */
interface ParsedDefinition {
  numDef: string;      // "1.", "2." etc.
  mainText: string;    // texto principal da definição
  example?: string;    // se houver
  synonyms?: string;   // se houver
  contraries?: string; // se houver
}

/** Estrutura para o título e subtítulo (exemplo: "écouter", "verbe transitif Conjugaison", etc.) */
interface ParsedHeader {
  title: string;      // texto do <h2 class="AdresseDefinition">
  catGram: string;    // texto do <p class="CatgramDefinition">
  origin: string;     // texto do <p class="OrigineDefinition">
}

/** Faz parse de <li class="DivisionDefinition"> individualmente. */
function parseDefinitionItem(li: HTMLLIElement): ParsedDefinition {
  const result: ParsedDefinition = {
    numDef: "",
    mainText: "",
  };

  // 1) Capturar número da definição: <span class="numDef">2.</span>
  const numSpan = li.querySelector("span.numDef");
  if (numSpan) {
    result.numDef = numSpan.textContent?.trim() || "";
  }

  // 2) Capturar texto principal, mas sem o <span.numDef>.
  const liClone = li.cloneNode(true) as HTMLLIElement;
  const spanDef = liClone.querySelector("span.numDef");
  if (spanDef) spanDef.remove(); // remove do clone para não poluir
  result.mainText = liClone.textContent?.trim() || "";

  // 3) Capturar exemplo: <span class="ExempleDefinition">...</span>
  const exampleSpan = li.querySelector("span.ExempleDefinition");
  if (exampleSpan) {
    result.example = exampleSpan.textContent?.trim() || "";
  }

  // 4) Capturar sinônimos e contrários.
  //    - Geralmente vem em <p class="LibelleSynonyme">Synonymes :</p>
  //      e logo abaixo <p class="Synonymes">agripper - retenir</p>
  //    - IDem para Contraires
  const libelleList = Array.from(li.querySelectorAll("p.LibelleSynonyme"));
  
  libelleList.forEach((p) => {
    const label = p.textContent?.toLowerCase().trim() || "";
    const next = p.nextElementSibling as HTMLElement | null;
    if (!next || !next.classList.contains("Synonymes")) {
      return;
    }
    // Pegamos o texto ex: "agripper - retenir"
    const textValue = next.textContent?.trim() || "";

    if (label.includes("synonym")) {
      // Evita duplicar sinônimos caso apareçam 2x
      if (!result.synonyms) {
        result.synonyms = textValue;
      } else if (!result.synonyms.includes(textValue)) {
        result.synonyms += " " + textValue;
      }
    } else if (label.includes("contrair")) {
      // Evita duplicar contrários
      if (!result.contraries) {
        result.contraries = textValue;
      } else if (!result.contraries.includes(textValue)) {
        result.contraries += " " + textValue;
      }
    }
  });

  return result;
}

/** Faz parse do bloco de cabeçalho: h2.AdresseDefinition, p.CatgramDefinition, p.OrigineDefinition. */
function parseHeader(doc: Document): ParsedHeader {
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

/** Faz parse das definições principais (até 3) e do cabeçalho. */
function parseHtmlFromLarousse(htmlString: string, maxDefinitions = 3) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");

  // 1) Pegar o cabeçalho
  const header = parseHeader(doc);

  // 2) Pegar definições <li class="DivisionDefinition">
  const liElements = Array.from(
    doc.querySelectorAll("li.DivisionDefinition")
  ) as HTMLLIElement[];

  // Pegamos até 'maxDefinitions' definições
  const sliced = liElements.slice(0, maxDefinitions);
  const parsedDefs = sliced.map((li) => parseDefinitionItem(li));

  return { header, definitions: parsedDefs };
}

export default function Home() {
  const [word, setWord] = useState("");
  const [rawHtml, setRawHtml] = useState(""); // HTML bruto do Larousse
  const [header, setHeader] = useState<ParsedHeader>({
    title: "",
    catGram: "",
    origin: "",
  });
  const [definitions, setDefinitions] = useState<ParsedDefinition[]>([]);

  // Quando o usuário digita a palavra
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setWord(event.target.value);
  };

  // Faz a busca na API
  const fetchDefinition = async (selectedWord: string) => {
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

  // Submissão do form
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    fetchDefinition(word);
  };

  // Selecionar palavra do histórico
  const handleSelectWordFromHistory = (selectedWord: string) => {
    setWord(selectedWord);
    fetchDefinition(selectedWord);
  };

  // Quando 'rawHtml' mudar, parseamos.
  useEffect(() => {
    if (rawHtml) {
      const parsed = parseHtmlFromLarousse(rawHtml, 3); 
      // se quiser apenas 2 definições, troque por parseHtmlFromLarousse(rawHtml, 2)
      setHeader(parsed.header);
      setDefinitions(parsed.definitions);
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
          {/* Histórico */}
          <Grid item xs={12} md={4}>
            <HistoryComponent onSelectWord={handleSelectWordFromHistory} />
          </Grid>

          {/* Conteúdo principal */}
          <Grid item xs={12} md={8}>
            {/* Formulário de busca */}
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

            {/* Se tiver cabeçalho ou definições, exibir */}
            {(header.title || definitions.length > 0) && (
              <Paper elevation={3} sx={{ p: 2 }}>
                {/* Exibir o cabeçalho/título */}
                {header.title && (
                  <Typography 
                    variant="h5" 
                    gutterBottom 
                    sx={{ fontWeight: "bold", color: "#333" }}
                  >
                    {header.title}
                  </Typography>
                )}

                {/* verbe transitif Conjugaison */}
                {header.catGram && (
                  <Typography variant="h6" gutterBottom sx={{ color: "#555" }}>
                    {header.catGram}
                  </Typography>
                )}

                {/* (bas latin ascultare, ...) */}
                {header.origin && (
                  <Typography variant="body1" gutterBottom sx={{ fontSize: "1.2rem", fontStyle: "italic" }}>
                    {header.origin}
                  </Typography>
                )}

                {/* Agora exibir as definições parseadas */}
                {definitions.map((defItem, index) => (
                  <Box
                    key={index}
                    sx={{
                      mt: 3,
                      p: 2,
                      borderLeft: "4px solid #1976d2",
                      backgroundColor: "#fefefe",
                    }}
                  >
                    {/* 1) Exibir "numDef + mainText" em fonte maior */}
                    <Typography variant="body1" sx={{ fontSize: "1.15rem", fontWeight: "bold", mb: 1 }}>
                      {defItem.numDef} {defItem.mainText}
                    </Typography>

                    {/* 2) Exemplo em outra linha, prefixado com 'Example:' */}
                    {defItem.example && (
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>Example:</strong> {defItem.example}
                      </Typography>
                    )}

                    {/* 3) Sinônimos em verde (na mesma linha, prefixado “Synonyme:”) */}
                    {defItem.synonyms && (
                      <Typography
                        variant="body1"
                        sx={{ 
                          mb: 1, 
                          color: "green", 
                          fontWeight: "bold",
                          whiteSpace: "pre-wrap" // se quiser quebrar nas reticências
                        }}
                      >
                        Synonyme: {defItem.synonyms}
                      </Typography>
                    )}

                    {/* 4) Contrários em vermelho (na mesma linha, prefixado “Contraires:”) */}
                    {defItem.contraries && (
                      <Typography
                        variant="body1"
                        sx={{ 
                          mb: 1, 
                          color: "red", 
                          fontWeight: "bold",
                          whiteSpace: "pre-wrap"
                        }}
                      >
                        Contraires: {defItem.contraries}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Paper>
            )}

            {/* Se não houver nada, mas há rawHtml, pode ser “Aucun résultat” */}
            {rawHtml && !header.title && definitions.length === 0 && (
              <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
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
