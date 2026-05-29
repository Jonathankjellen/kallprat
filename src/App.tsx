import { useState } from 'react';
import Header from './components/Header';
import CategoryList from './components/CategoryList';
import KallpratView from './components/KallpratView';
import data from './data/kallprat.json';
import type { Category, Kallprat } from './types';

const categories: Category[] = data.categories;
const allKallprat: Kallprat[] = data.kallprat;

function App() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const activeCategory = categories.find((c) => c.id === selectedCategory) ?? null;
  const filteredItems = selectedCategory
    ? allKallprat.filter((k) => k.category === selectedCategory)
    : [];

  const folioNum = activeCategory
    ? String(categories.findIndex((c) => c.id === activeCategory.id) + 1).padStart(2, '0')
    : '01';
  const folioLabel = activeCategory ? `Sektion ${folioNum}` : 'Vol. I · Nº 01';

  return (
    <div className="min-h-screen">
      <Header onBack={selectedCategory ? () => setSelectedCategory(null) : null} />
      {activeCategory && filteredItems.length > 0 ? (
        <KallpratView
          category={activeCategory}
          items={filteredItems}
          categories={categories}
          onSelectCategory={setSelectedCategory}
        />
      ) : (
        <CategoryList
          categories={categories}
          allKallprat={allKallprat}
          onSelect={setSelectedCategory}
        />
      )}
      <span className="folio" aria-hidden>
        <span className="folio-mark">✦</span>
        {folioLabel}
      </span>
    </div>
  );
}

export default App;
