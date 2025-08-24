// /app/components/TextToSpeechButton.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { IconButton, CircularProgress } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';

interface TextToSpeechButtonProps {
  textToSpeak: string;
}

const TextToSpeechButton: React.FC<TextToSpeechButtonProps> = ({ textToSpeak }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [bestVoice, setBestVoice] = useState<SpeechSynthesisVoice | null>(null);

  // Efeito para carregar e selecionar a melhor voz francesa disponível
  useEffect(() => {
    const loadAndSetVoice = () => {
      // Pega a lista de todas as vozes disponíveis no navegador
      const voices = window.speechSynthesis.getVoices();
      
      if (voices.length === 0) return; // Se as vozes ainda não carregaram, sai

      // Filtra para encontrar apenas as vozes em francês
      const frenchVoices = voices.filter(voice => voice.lang.startsWith('fr'));

      if (frenchVoices.length > 0) {
        // Lógica para encontrar a "melhor" voz:
        // 1. Prioriza vozes que se identificam como "Google français".
        // 2. Prioriza vozes com "premium", "enhanced" ou "ameliorée" no nome.
        // 3. Se nenhuma for encontrada, usa a primeira voz francesa da lista.
        const selectedVoice = 
          frenchVoices.find(v => v.name === 'Google français') ||
          frenchVoices.find(v => v.name.toLowerCase().includes('premium')) ||
          frenchVoices.find(v => v.name.toLowerCase().includes('enhanced')) ||
          frenchVoices.find(v => v.name.toLowerCase().includes('améliorée')) ||
          frenchVoices[0];
        
        setBestVoice(selectedVoice);
      }
    };

    // O evento 'voiceschanged' é disparado quando a lista de vozes está pronta
    window.speechSynthesis.onvoiceschanged = loadAndSetVoice;
    // Chama a função uma vez caso as vozes já estejam carregadas
    loadAndSetVoice();

    // Limpa o evento quando o componente é desmontado
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const handleSpeak = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();

    if (!textToSpeak || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert("Desculpe, seu navegador não suporta a leitura de texto.");
      return;
    }
    
    // Para a fala atual e limpa a fila
    window.speechSynthesis.cancel();
    setIsLoading(true);

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.9;

    // A MÁGICA ACONTECE AQUI:
    // Se encontramos uma voz de alta qualidade, nós a usamos.
    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    // Evento que é disparado quando a fala termina
    utterance.onend = () => {
      setIsLoading(false);
    };
    
    // Evento em caso de erro
    utterance.onerror = () => {
        console.error("Ocorreu um erro ao tentar reproduzir a voz.");
        setIsLoading(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [textToSpeak, bestVoice]);

  return (
    <IconButton 
      onClick={handleSpeak} 
      size="small" 
      aria-label="Ouvir a pronúncia"
      disabled={isLoading}
      sx={{ color: '#1976d2' }}
    >
      {isLoading ? <CircularProgress size={24} /> : <VolumeUpIcon />}
    </IconButton>
  );
};

export default TextToSpeechButton;