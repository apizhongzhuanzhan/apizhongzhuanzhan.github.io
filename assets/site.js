const search = document.querySelector("[data-station-search]");

if (search) {
  const cards = [...document.querySelectorAll("[data-station-card]")];
  const empty = document.querySelector("[data-search-empty]");
  const count = document.querySelector("[data-visible-count]");

  search.addEventListener("input", () => {
    const query = search.value.trim().toLocaleLowerCase("zh-CN");
    let visible = 0;
    for (const card of cards) {
      const matches = !query || card.textContent.toLocaleLowerCase("zh-CN").includes(query);
      card.hidden = !matches;
      if (matches) visible += 1;
    }
    if (empty) empty.style.display = visible ? "none" : "block";
    if (count) count.textContent = String(visible);
  });
}
