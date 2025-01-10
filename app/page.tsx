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

// Importe seus componentes conforme sua estrutura:
import Header from "./components/Header";
import HistoryComponent from "./components/history";

/** Estrutura para o cabeçalho (título, categoria e origem). */
interface ParsedHeader {
  title: string;   // Ex.: " écouter"
  catGram: string; // Ex.: "verbe transitif Conjugaison"
  origin: string;  // Ex.: "(bas latin ascultare...)"
}

/** Estrutura para cada definição (no máximo 2). */
interface ParsedDefinition {
  numDef: string;      // Ex.: "1."
  mainText: string;    // Ex.: "Qui fait intentionnellement du mal à autrui..."
  example?: string;    // Ex.: "Un méchant homme."
  synonyms?: string;   // Ex.: "brutal - cruel - dur..."
  contraries?: string; // Ex.: "bon - gentil - humain..."
}

/**
 * Faz parse do cabeçalho: <h2 class="AdresseDefinition">, <p class="CatgramDefinition">, <p class="OrigineDefinition">
 */
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

/**
 * Faz parse de um item <li class="DivisionDefinition">, removendo sinônimos, contrários e exemplos do texto principal.
 */
function parseDefinitionItem(li: HTMLLIElement): ParsedDefinition {
  const result: ParsedDefinition = {
    numDef: "",
    mainText: "",
  };

  // 1) Capturar número da definição, ex.: <span class="numDef">1.</span>
  const numSpan = li.querySelector("span.numDef");
  if (numSpan) {
    result.numDef = numSpan.textContent?.trim() || "";
  }

  // 2) Clonar o <li> para retirar elementos que não queremos no 'mainText'
  const liClone = li.cloneNode(true) as HTMLLIElement;

  // Remover <span class="numDef"> do clone
  const spanDefClone = liClone.querySelector("span.numDef");
  if (spanDefClone) {
    spanDefClone.remove();
  }

  // 3) Capturar Example em <span class="ExempleDefinition"> e remover do clone
  const exampleSpan = liClone.querySelector("span.ExempleDefinition");
  if (exampleSpan) {
    result.example = exampleSpan.textContent?.trim() || "";
    exampleSpan.remove(); // remove do clone
  }

  // 4) Capturar sinônimos e contrários
  const libelleList = Array.from(liClone.querySelectorAll("p.LibelleSynonyme"));

  libelleList.forEach((p) => {
    const label = p.textContent?.toLowerCase() || "";
    const next = p.nextElementSibling as HTMLElement | null;
    if (next && next.classList.contains("Synonymes")) {
      const textValue = next.textContent?.trim() || "";

      // Se for "Synonymes :"
      if (label.includes("synonym")) {
        result.synonyms = (result.synonyms || "") + textValue;
      }
      // Se for "Contraires :"
      else if (label.includes("contrair")) {
        result.contraries = (result.contraries || "") + textValue;
      }

      // Remove p.Synonymes do clone
      next.remove();
    }

    // Remove p.LibelleSynonyme do clone
    p.remove();
  });

  // 5) Agora liClone está sem sinônimos/contrários/exemplo. Pegamos o textContent como "mainText".
  result.mainText = liClone.textContent?.trim() || "";

  return result;
}

/**
 * Faz o parse global do HTML do Larousse: cabeçalho e no máximo 2 definições.
 */
function parseHtmlFromLarousse(htmlString: string, maxDefs = 2) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");

  // 1) Cabeçalho
  const header = parseHeader(doc);

  // 2) Definições
  const liElements = Array.from(
    doc.querySelectorAll("li.DivisionDefinition")
  ) as HTMLLIElement[];
  const sliced = liElements.slice(0, maxDefs);
  const parsedDefs = sliced.map(parseDefinitionItem);

  return { header, definitions: parsedDefs };
}

/**
 * Componente principal: busca a definição, exibe título, mostra até 2 definições,
 * remove duplicações de sinônimos/contrários no texto principal, etc.
 */
export default function Home() {
  const [word, setWord] = useState("");
  const [rawHtml, setRawHtml] = useState(""); // HTML retornado pela API
  const [header, setHeader] = useState<ParsedHeader>({
    title: "",
    catGram: "",
    origin: "",
  });
  const [definitions, setDefinitions] = useState<ParsedDefinition[]>([]);

  // Quando o usuário digita no campo
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setWord(event.target.value);
  };

  // Função que chama o backend para obter a definição
  const fetchDefinition = async (selectedWord: string) => {
    try {
      const response = await axios.get(
        `https://flask-hello-world-jet-kappa-11.vercel.app/api/definitions?word=${encodeURIComponent(selectedWord)}`
      );
      // Sanitiza o HTML recebido
      const sanitizedHtml = DOMPurify.sanitize(response.data.definition);
      setRawHtml(sanitizedHtml);
    } catch (error) {
      console.error("Falha ao buscar a definição:", error);
    }
  };

  // Quando submeter o formulário
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    fetchDefinition(word);
  };

  // Quando clicar em uma palavra do histórico
  const handleSelectWordFromHistory = (selectedWord: string) => {
    setWord(selectedWord);
    fetchDefinition(selectedWord);
  };

  // Sempre que rawHtml muda, parseamos
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
          {/* Lado esquerdo: Histórico */}
          <Grid item xs={12} md={4}>
            <HistoryComponent onSelectWord={handleSelectWordFromHistory} />
          </Grid>

          {/* Lado direito: conteúdo principal */}
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

            {/* Exibir cabeçalho (title, catGram, origin) + definições */}
            {(header.title || definitions.length > 0) && (
              <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                {/* Título (ex.: " écouter") */}
                {header.title && (
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ fontWeight: "bold", color: "#333" }}
                  >
                    {header.title}
                  </Typography>
                )}

                {/* Categoria (ex.: "verbe transitif Conjugaison") */}
                {header.catGram && (
                  <Typography variant="h6" gutterBottom sx={{ color: "#555" }}>
                    {header.catGram}
                  </Typography>
                )}

                {/* Origem (ex.: "(bas latin ascultare, etc.)") */}
                {header.origin && (
                  <Typography
                    variant="body1"
                    gutterBottom
                    sx={{ fontSize: "1.1rem", fontStyle: "italic" }}
                  >
                    {header.origin}
                  </Typography>
                )}

                {/* Lista de definições (no máximo 2) */}
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
                    {/* Linha principal: numero + texto */}
                    <Typography
                      variant="body1"
                      sx={{ fontSize: "1.15rem", fontWeight: "bold", mb: 1 }}
                    >
                      {defItem.numDef} {defItem.mainText}
                    </Typography>

                    {/* Example */}
                    {defItem.example && (
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>Example:</strong> {defItem.example}
                      </Typography>
                    )}

                    {/* Synonyme (em verde) */}
                    {defItem.synonyms && (
                      <Typography
                        variant="body1"
                        sx={{ mb: 1, color: "green", fontWeight: "bold" }}
                      >
                        Synonyme: {defItem.synonyms}
                      </Typography>
                    )}

                    {/* Contraires (em vermelho) */}
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

            {/* Se rawHtml existir, mas nada foi parseado, pode ser "Aucun résultat" */}
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
