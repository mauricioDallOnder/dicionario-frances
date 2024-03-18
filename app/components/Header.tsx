import React from 'react';
import { AppBar, Toolbar, Typography, Box, Container } from '@mui/material';
import Image from "next/image";
import iconeBandeira from './iconeFranca.svg'; // Suponha que iconeBandeira seja o caminho para sua imagem de bandeira

export default function Header() {
  return (
    <AppBar position="static" sx={{ marginBottom: "15px" }}>
      <Container maxWidth="lg">
        <Toolbar sx={{ justifyContent: 'center', alignItems: 'center' }}>
          {/* Container para a bandeira esquerda e a palavra */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 30, height: 20, marginRight: 2, position: 'relative' }}>
              <Image src={iconeBandeira} layout="fill" objectFit="contain" alt="Bandeira da França" />
            </Box>
            <Typography variant="h6" component="div">
              DICIONÁRIO DE FRANCÊS
            </Typography>
          </Box>
          {/* Container para a bandeira direita */}
          <Box sx={{ width: 30, height: 20, marginLeft: 2, position: 'relative' }}>
            <Image src={iconeBandeira} layout="fill" objectFit="contain" alt="Bandeira da França" />
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
