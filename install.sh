#!/usr/bin/env bash

# Installation Script for MDViewer Desktop on Linux
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Configurando permissões de execução..."
chmod +x "$DIR/bin/mdviewer"

echo "==> Instalando atalho de terminal em ~/.local/bin/mdviewer..."
mkdir -p "$HOME/.local/bin"
ln -sf "$DIR/bin/mdviewer" "$HOME/.local/bin/mdviewer"

echo "==> Instalando lançador de aplicativos desktop em ~/.local/share/applications/..."
mkdir -p "$HOME/.local/share/applications"

echo "==> Instalando ícones do sistema em ~/.local/share/icons/hicolor/..."
mkdir -p "$HOME/.local/share/icons/hicolor/512x512/apps"
mkdir -p "$HOME/.local/share/icons/hicolor/128x128/apps"
mkdir -p "$HOME/.local/share/icons/hicolor/48x48/apps"
mkdir -p "$HOME/.local/share/icons/hicolor/16x16/apps"
mkdir -p "$HOME/.local/share/icons/hicolor/scalable/apps"

cp "$DIR/src/assets/icon.png" "$HOME/.local/share/icons/hicolor/512x512/apps/mdviewer.png"
cp "$DIR/src/extension/assets/icon128.png" "$HOME/.local/share/icons/hicolor/128x128/apps/mdviewer.png"
cp "$DIR/src/extension/assets/icon48.png" "$HOME/.local/share/icons/hicolor/48x48/apps/mdviewer.png"
cp "$DIR/src/extension/assets/icon16.png" "$HOME/.local/share/icons/hicolor/16x16/apps/mdviewer.png"
cp "$DIR/src/assets/icon.svg" "$HOME/.local/share/icons/hicolor/scalable/apps/mdviewer.svg"

# Update absolute paths dynamically in the desktop file for the current user/directory
sed -e "s|Exec=.*|Exec=\"$DIR/bin/mdviewer\" %F|" \
    -e "s|Icon=.*|Icon=$DIR/src/assets/icon.png|" \
    "$DIR/mdviewer.desktop" > "$HOME/.local/share/applications/mdviewer.desktop"

chmod +x "$HOME/.local/share/applications/mdviewer.desktop"

if command -v update-desktop-database &> /dev/null; then
    update-desktop-database "$HOME/.local/share/applications" 2>/dev/null || true
fi

if command -v gtk-update-icon-cache &> /dev/null; then
    gtk-update-icon-cache -f -t "$HOME/.local/share/icons/hicolor" 2>/dev/null || true
fi

echo "============================================================"
echo "✅ MDViewer instalado com sucesso!"
echo ""
echo "Você pode rodar:"
echo "  • No terminal: mdviewer sample.md (ou ./bin/mdviewer)"
echo "  • No menu de aplicativos do Linux: pesquise por 'MDViewer'"
echo "  • Com npm: npm start"
echo "============================================================"
