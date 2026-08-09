// Lê um arquivo de imagem escolhido pela família e devolve uma versão pequena
// (redimensionada + comprimida) como data URL, pronta pra guardar no aparelho.
// Passar a imagem por um <canvas> também tem um efeito colateral bom: qualquer
// coisa maliciosa escondida no arquivo original não sobrevive — o que sai do
// canvas são só os pixels, redesenhados do zero.
export function readAndCompressImage(file, { maxSize = 220, quality = 0.72 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Escolha um arquivo de imagem"));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Não foi possível abrir essa imagem"));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
