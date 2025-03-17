const catalogList = document.getElementById('catalog-list')

async function queryFetch (query, variables) {
  return await fetch('http://localhost:3000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      variables
    })
  }).then(res => res.json())
}

queryFetch(`
  {
    books {
      id
      title
      publishedDate
      imageUrl
      downloadUrl
      author {
        id
        name
      }
    }
  }
`).then(async data => {
  data.data.books.forEach(async element => {
    const li = document.createElement('li');
    li.innerHTML = `Autor: ${element.author.name}`

    const p = document.createElement('p')
    p.innerHTML = element.title;
    li.appendChild(p);

    const img = document.createElement('img');
    img.src = element.imageUrl;
    img.alt = element.title;
    img.width = 200;

    li.appendChild(img);

    catalogList.append(li);

    const fileUrl = element.downloadUrl;

    if (fileUrl) {
      img.addEventListener('click', async () => {
        try {
          await downloadPdf(fileUrl, element.title);
        } catch (error) {
          console.error('Erro ao baixar arquivo:', error);
        }
      });
    }
  });
})

async function downloadPdf(pdfUrl, fileName) {
  fetch(`http://localhost:3000/proxy/download-pdf?url=${pdfUrl}`, {
    headers: {
      'Content-Type': 'application/pdf'
    }
  })
    .then(response => response.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);

      link.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    })
    .catch(error => {
      console.error("Download do PDF falhou: ", error);
    });
}
