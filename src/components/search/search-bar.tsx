'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, TrendingUp, Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'

interface SearchSuggestion {
  id: string
  title: string
  category: string
  sparkCount: number
}

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
  isLoading?: boolean
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = "Search for ideas...",
  className,
  isLoading = false
}) => {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Get search suggestions
  const popularSuggestions = useQuery(api.search.getSearchSuggestions, { limit: 5 }) || []

  // Debounced search
  const debouncedOnSearch = useCallback(
    (searchQuery: string) => {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        if (searchQuery.trim().length >= 2) {
          setShowSuggestions(true)
        }
      }, 300)
    },
    []
  )

  // Update suggestions when query changes
  useEffect(() => {
    if (query.trim()) {
      debouncedOnSearch(query)
    } else {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }
  }, [query, debouncedOnSearch])

  // Handle outside click to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }
  }

  const handleClear = () => {
    setQuery('')
    setShowSuggestions(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.title)
    onSearch(suggestion.title)
    setShowSuggestions(false)
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || popularSuggestions.length === 0) {
      if (e.key === 'Escape') {
        setQuery('')
        setShowSuggestions(false)
        inputRef.current?.blur()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < popularSuggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : popularSuggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < popularSuggestions.length) {
          handleSuggestionClick(popularSuggestions[selectedIndex])
        } else if (query.trim()) {
          onSearch(query.trim())
          setShowSuggestions(false)
          setSelectedIndex(-1)
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  return (
    <div className={cn('relative', className)}>
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              setIsFocused(true)
              if (query.trim().length >= 2 || (!query.trim() && popularSuggestions.length > 0)) {
                setShowSuggestions(true)
              }
            }}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              'pl-10 pr-10 transition-all duration-200',
              isFocused && 'ring-2 ring-primary/20 border-primary',
              showSuggestions && 'rounded-b-none border-b-0'
            )}
            aria-label="Search input"
            aria-expanded={showSuggestions}
            aria-haspopup="listbox"
            role="combobox"
            aria-activedescendant={selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined}
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={!query.trim() || isLoading}
          className="ml-2"
          aria-label="Submit search"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && popularSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 z-50 bg-background border border-t-0 rounded-b-md shadow-lg max-h-80 overflow-y-auto"
          role="listbox"
        >
          {query.trim() ? (
            <div className="p-2 border-b">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Popular ideas
              </div>
            </div>
          ) : (
            <div className="p-2 border-b">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Trending ideas
              </div>
            </div>
          )}

          {popularSuggestions.map((suggestion: SearchSuggestion, index: number) => (
            <button
              key={suggestion.id}
              id={`suggestion-${index}`}
              className={cn(
                'w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center justify-between',
                selectedIndex === index && 'bg-muted'
              )}
              onClick={() => handleSuggestionClick(suggestion)}
              role="option"
              aria-selected={selectedIndex === index}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{suggestion.title}</div>
                <div className="text-sm text-muted-foreground">{suggestion.category}</div>
              </div>
              <div className="text-sm text-muted-foreground ml-2">
                {suggestion.sparkCount} sparks
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}