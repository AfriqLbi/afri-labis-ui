import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type Cat = { slug: string; name: string };

const pillClass = (active: boolean) =>
  `px-5 py-2 text-xs tracking-[0.15em] uppercase transition-all duration-200 cursor-pointer whitespace-nowrap border shrink-0 ${
    active
      ? "bg-primary text-primary-foreground border-primary"
      : "bg-transparent text-muted-foreground border-border hover:border-primary hover:text-primary"
  }`;

export function CategoryBar({
  categories,
  active,
  onChange,
}: {
  categories: Cat[];
  active: string;
  onChange: (slug: string) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const [open, setOpen] = useState(false);

  const update = () => {
    const el = scroller.current;
    if (!el) return;
    setEdges({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  };

  useEffect(() => {
    update();
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [categories.length]);

  // keep the selected pill visible
  useEffect(() => {
    scroller.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [active]);

  const scrollBy = (dir: 1 | -1) =>
    scroller.current?.scrollBy({
      left: dir * scroller.current.clientWidth * 0.6,
      behavior: "smooth",
    });

  // fade only the edges that have more content
  const mask = `linear-gradient(to right, ${edges.left ? "transparent 0, black 40px" : "black 0"}, ${
    edges.right ? "black calc(100% - 40px), transparent 100%" : "black 100%"
  })`;

  const select = (slug: string) => {
    onChange(slug);
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-2 mb-8">
      {/* All categories */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            className={`${pillClass(false)} flex items-center gap-2`}
            style={{ fontFamily: "'Montserrat', sans-serif" }}
            aria-label="Browse all categories"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            All
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[80dvh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle
              className="text-xs tracking-[0.15em] uppercase"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Categories
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-wrap gap-2 p-4">
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => select(cat.slug)}
                aria-pressed={active === cat.slug}
                className={pillClass(active === cat.slug)}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Scrolling row */}
      <div className="relative min-w-0 flex-1">
        <div
          ref={scroller}
          onScroll={update}
          className="flex gap-2 overflow-x-auto overscroll-x-contain scrollbar-none [&::-webkit-scrollbar]:hidden"
          style={{ maskImage: mask, WebkitMaskImage: mask }}
        >
          {categories.map((cat) => (
            <button
              key={cat.slug}
              data-active={active === cat.slug}
              aria-pressed={active === cat.slug}
              onClick={() => onChange(cat.slug)}
              className={pillClass(active === cat.slug)}
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {edges.left && (
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Scroll categories left"
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 h-8 w-8 items-center justify-center border border-border bg-background text-muted-foreground hover:border-primary hover:text-primary"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {edges.right && (
          <button
            onClick={() => scrollBy(1)}
            aria-label="Scroll categories right"
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 items-center justify-center border border-border bg-background text-muted-foreground hover:border-primary hover:text-primary"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}