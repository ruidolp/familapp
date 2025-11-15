/**
 * CategoryContext
 * Contexto para pasar la categoría preseleccionada entre ListadoCategorías y CrearGastoDrawer
 */

'use client'

import React, { createContext, useContext, useState } from 'react'

interface CategoryContextType {
  selectedCategoryId: string | null
  setSelectedCategoryId: (id: string | null) => void
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined)

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

  return (
    <CategoryContext.Provider value={{ selectedCategoryId, setSelectedCategoryId }}>
      {children}
    </CategoryContext.Provider>
  )
}

export function useCategoryContext() {
  const context = useContext(CategoryContext)
  if (!context) {
    throw new Error('useCategoryContext must be used within CategoryProvider')
  }
  return context
}
