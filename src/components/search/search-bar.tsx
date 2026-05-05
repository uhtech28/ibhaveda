'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, TrendingUp, Lightbulb, User2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'

interface SearchSuggestion {
  id: string
  title: string
  category: string
  sparkCount: number
  type?: 'idea' | 'user'
  username?: string
  displayName?: string
  avatar?: string
  skills?: string[]
}

interface UserResult {
  _id: string
  displayName: string
  username: string
  avatar?: string
  skills?: string[]
  ideasCreated?: number
  ideasSparked?: number
}

interface IdeaResult {
  _id: string
  title: string
  category: string
  sparkCount: number
  author?: { displayName?: string; name?: string }
  contributionCount?: number
}

interface SearchBarProps {
  onSearch: (query: string, type?: 'idea' | 'user') => void
  placeholder?: string
  className?: string
  value?: string
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = "Search for ideas, people, and more...",
  className,
  value,
}) => {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Get comprehensive search results
  const searchData = useQuery(api.search.searchEverything, {
    query: query.trim(),
    limit: 8
  }) || { ideas: [], users: [] }

  // Only show search results when query is long enough
  const showSearchResults = query.trim().length >= 2 && (searchData.ideas.length > 0 || searchData.users.length > 0)

  // Get popular suggestions when no query
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

  // Sync query with value prop if provided
  useEffect(() => {
    if (value !== undefined) {
      setQuery(value)
    }
  }, [value])

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
    if (suggestion.type === 'user') {
      // Navigate to user profile
      window.location.href = `/profile/${suggestion.username}`
    } else {
      // Search for ideas
      setQuery(suggestion.title)
      onSearch(suggestion.title, 'idea')
    }
    setShowSuggestions(false)
    setSelectedIndex(-1)
  }

  const getTotalSuggestions = () => {
    if (showSearchResults) {
      return searchData.users.length + searchData.ideas.length
    }
    return popularSuggestions.length
  }

  const getSuggestionAtIndex = (index: number) => {
    if (showSearchResults) {
      if (index < searchData.users.length) {
        const user = searchData.users[index]
        return {
          id: user._id,
          title: user.displayName,
          category: 'User',
          sparkCount: user.ideasCreated || 0,
          type: 'user' as const,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          skills: user.skills
        }
      } else {
        const ideaIndex = index - searchData.users.length
        const idea = searchData.ideas[ideaIndex]
        return {
          id: idea._id,
          title: idea.title,
          category: idea.category,
          sparkCount: idea.sparkCount,
          type: 'idea' as const
        }
      }
    }
    return popularSuggestions[index]
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalSuggestions = getTotalSuggestions()

    if (!showSuggestions || totalSuggestions === 0) {
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
          prev < totalSuggestions - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : totalSuggestions - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < totalSuggestions) {
          const suggestion = getSuggestionAtIndex(selectedIndex)
          handleSuggestionClick(suggestion)
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
              if (query.trim().length >= 2 || showSearchResults || (!query.trim() && popularSuggestions.length > 0)) {
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
      </form>

      {/* Suggestions Dropdown — show search results on all sizes; show trending only on desktop */}
      {(showSearchResults || (showSuggestions && popularSuggestions.length > 0 && !showSearchResults)) && (
        <div
          ref={suggestionsRef}
          className={cn(
            "fixed left-2 right-2 lg:absolute lg:left-0 lg:right-0 z-40 bg-background border rounded-md shadow-xl lg:shadow-lg max-h-[70vh] lg:max-h-96 overflow-y-auto",
            "top-[80px] lg:top-full lg:border-t-0 lg:rounded-t-none lg:rounded-b-md",
            !showSearchResults && "hidden lg:block"
          )}
          role="listbox"
        >
          {/* Show search results when query is active */}
          {showSearchResults ? (
            <>
              {/* Users Section */}
              {searchData.users.length > 0 && (
                <>
                  <div className="p-3 border-b bg-muted/30">
                    <div className="text-sm font-medium text-foreground flex items-center gap-2">
                      <User2 className="h-4 w-4" />
                      People ({searchData.users.length})
                    </div>
                  </div>
                  {searchData.users.map((user: UserResult, index: number) => (
                    <button
                      key={`user-${user._id}`}
                      id={`suggestion-user-${index}`}
                      className={cn(
                        'w-full text-left px-3 py-3 hover:bg-muted transition-colors flex items-center gap-3',
                        selectedIndex === index && 'bg-muted'
                      )}
                      onClick={() => handleSuggestionClick({
                        id: user._id,
                        title: user.displayName,
                        category: 'User',
                        sparkCount: user.ideasCreated || 0,
                        type: 'user',
                        username: user.username,
                        displayName: user.displayName,
                        avatar: user.avatar,
                        skills: user.skills
                      })}
                      role="option"
                      aria-selected={selectedIndex === index}
                    >
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={user.avatar} alt={user.displayName} />
                        <AvatarFallback className="text-xs">
                          {user.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{user.displayName}</div>
                        <div className="text-sm text-muted-foreground">@{user.username}</div>
                        {user.skills && user.skills.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {user.skills.slice(0, 2).map((skill: string, skillIndex: number) => (
                              <Badge key={skillIndex} variant="outline" className="text-xs px-1.5 py-0.5">
                                {skill}
                              </Badge>
                            ))}
                            {user.skills.length > 2 && (
                              <span className="text-xs text-muted-foreground">+{user.skills.length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        <div>{user.ideasCreated || 0} ideas</div>
                        <div>{user.ideasSparked || 0} sparked</div>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* Ideas Section */}
              {searchData.ideas.length > 0 && (
                <>
                  <div className="p-3 border-b bg-muted/30">
                    <div className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Ideas ({searchData.ideas.length})
                    </div>
                  </div>
                  {searchData.ideas.map((idea: IdeaResult, index: number) => (
                    <button
                      key={`idea-${idea._id}`}
                      id={`suggestion-idea-${index}`}
                      className={cn(
                        'w-full text-left px-3 py-3 hover:bg-muted transition-colors flex items-center justify-between',
                        selectedIndex === index + searchData.users.length && 'bg-muted'
                      )}
                      onClick={() => handleSuggestionClick({
                        id: idea._id,
                        title: idea.title,
                        category: idea.category,
                        sparkCount: idea.sparkCount,
                        type: 'idea'
                      })}
                      role="option"
                      aria-selected={selectedIndex === index + searchData.users.length}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{idea.title}</div>
                        <div className="text-sm text-muted-foreground truncate">{idea.category}</div>
                        {idea.author && (
                          <div className="text-xs text-muted-foreground mt-1">
                            by {idea.author.displayName || idea.author.name}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground ml-2 flex flex-col items-end">
                        <span>{idea.sparkCount || 0} sparks</span>
                        <span>{idea.contributionCount || 0} contrib</span>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </>
          ) : (
            /* Show trending/popular suggestions when no query */
            <>
              <div className="p-3 border-b bg-muted/30">
                <div className="text-sm font-medium text-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Trending Ideas
                </div>
              </div>

              {popularSuggestions.map((suggestion: SearchSuggestion, index: number) => (
                <button
                  key={suggestion.id}
                  id={`suggestion-${index}`}
                  className={cn(
                    'w-full text-left px-3 py-3 hover:bg-muted transition-colors flex items-center justify-between',
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
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    {suggestion.sparkCount}
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}