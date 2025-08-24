// /app/components/AutocompleteSearch.tsx
"use client";
import React, { useState, useEffect } from "react";
import { TextField, Autocomplete } from "@mui/material";
import axios from "axios";

interface AutocompleteSearchProps {
  onSearch: (word: string) => void;
  initialWord?: string;
}

export default function AutocompleteSearch({ onSearch, initialWord = "" }: AutocompleteSearchProps) {
  const [value, setValue] = useState<string | null>(initialWord);
  const [inputValue, setInputValue] = useState(initialWord);
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Efeito que busca sugestões na API quando o usuário digita
  useEffect(() => {
    // Se o input estiver vazio ou muito curto, limpa as opções
    if (inputValue.length < 2) {
      setOptions([]);
      return;
    }

    setLoading(true);
    // Usa um 'debounce' para esperar o usuário parar de digitar
    const delayDebounceFn = setTimeout(() => {
      // Chama nossa nova API
      axios.get(`/api/search?term=${inputValue}`)
        .then(response => {
          setOptions(response.data);
          setLoading(false);
        })
        .catch(error => {
          console.error("Erro ao buscar sugestões:", error);
          setLoading(false);
        });
    }, 500); // Espera 500ms após a última tecla pressionada

    // Limpa o timeout se o usuário digitar novamente
    return () => clearTimeout(delayDebounceFn);
  }, [inputValue]); // Este efeito roda toda vez que 'inputValue' muda

  const handleSearch = () => {
    // Permite que o usuário pesquise mesmo que a palavra não esteja na lista
    if (inputValue) {
      onSearch(inputValue);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <Autocomplete
        value={value}
        onChange={(event: any, newValue: string | null) => {
          setValue(newValue);
          if (newValue) {
            onSearch(newValue); // Busca ao selecionar
          }
        }}
        inputValue={inputValue}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
        id="autocomplete-dictionary-server"
        options={options}
        loading={loading}
        fullWidth
        freeSolo // Permite digitar palavras que não estão nas sugestões
        filterOptions={(x) => x} // Desativa a filtragem do lado do cliente
        renderInput={(params) => (
          <TextField
            {...params}
            label="Digite uma palavra"
            variant="outlined"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <span style={{ fontSize: '0.8rem' }}>Buscando...</span> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
       <button 
        type="button" 
        onClick={handleSearch}
        style={{
          padding: '15px 20px',
          backgroundColor: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          height: '56px'
        }}
      >
        Buscar
      </button>
    </div>
  );
}