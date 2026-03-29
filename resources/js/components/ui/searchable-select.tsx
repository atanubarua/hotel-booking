import * as React from "react"
import { CheckIcon, ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface SearchableSelectProps {
    value: string
    onValueChange: (value: string) => void
    options: { value: string; label: string }[]
    placeholder?: string
    className?: string
}

export function SearchableSelect({
    value,
    onValueChange,
    options,
    placeholder = "Select...",
    className,
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")
    const inputRef = React.useRef<HTMLInputElement>(null)
    const containerRef = React.useRef<HTMLDivElement>(null)

    const selectedOption = options.find((opt) => opt.value === value)

    const filteredOptions = React.useMemo(() => {
        if (!search) return options
        return options.filter((opt) =>
            opt.label.toLowerCase().includes(search.toLowerCase())
        )
    }, [options, search])

    React.useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen])

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
                setSearch("")
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleSelect = (optionValue: string) => {
        onValueChange(optionValue)
        setIsOpen(false)
        setSearch("")
    }

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
            >
                {selectedOption ? (
                    <span className="flex items-center gap-1">
                        {selectedOption.label}
                    </span>
                ) : (
                    <span className="text-muted-foreground">{placeholder}</span>
                )}
                <ChevronDownIcon className={cn("h-4 w-4 opacity-50 transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 min-w-[320px] rounded-md border bg-popover p-0 text-popover-foreground shadow-md outline-none animate-in">
                    <div className="flex items-center border-b px-3">
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search..."
                            className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                        />
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1">
                        {filteredOptions.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                No results found.
                            </div>
                        ) : (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className={cn(
                                        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-left",
                                        option.value === value && "bg-accent"
                                    )}
                                >
                                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                        {option.value === value && (
                                            <CheckIcon className="h-4 w-4" />
                                        )}
                                    </span>
                                    <span className="truncate">{option.label}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
