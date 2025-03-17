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
`).then(data => {
  data.data.books.forEach(element => {
    const li = document.createElement('li')
    li.innerHTML = element.title

    const img = document.createElement('img')
    img.src = element.imageUrl
    img.alt = element.title
    img.width = 200

    const handleClick = () => {
      window.location.href = element.downloadUrl
    }

    img.addEventListener('click', handleClick)

    li.addEventListener('DOMNodeRemoved', () => {
      img.removeEventListener('click', handleClick)
    })

    li.appendChild(img)

    catalogList.append(li)
  });
})

