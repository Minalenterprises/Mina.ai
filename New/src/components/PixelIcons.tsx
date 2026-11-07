/**
 * Pixel-grid icons that match the pixel-sky language. Each icon is drawn on
 * an 8×8 grid ('#' = filled pixel) and renders crisp at any size.
 */
type P = { size?: number; className?: string; title?: string }
function make(rows: string[]) {
  const rects: [number, number][] = []
  rows.forEach((row, y) => [...row].forEach((c, x) => { if (c === '#') rects.push([x, y]) }))
  return function PixelIcon({ size = 16, className = '', title }: P) {
    return <svg className={`px-icon ${className}`} width={size} height={size} viewBox="0 0 8 8" shapeRendering="crispEdges" fill="currentColor" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>{title && <title>{title}</title>}{rects.map(([x, y]) => <rect key={`${x}${y}`} x={x} y={y} width="1.02" height="1.02" />)}</svg>
  }
}
export const PixelSpark = make(['...#....', '...#....', '..###...', '#######.', '..###...', '...#....', '...#....', '........'])
export const PixelImage = make(['########', '#......#', '#.##...#', '#.##...#', '#....#.#', '#.#.###.', '#######.', '........'].map(r => r.slice(0, 8)))
export const PixelChat = make(['.######.', '#......#', '#.#.#..#', '#......#', '.######.', '.##.....', '.#......', '........'])
export const PixelArrow = make(['........', '..#####.', '.....##.', '....#.#.', '...#..#.', '..#...#.', '.#......', '........'])
export const PixelBox = make(['..####..', '.#....#.', '#......#', '########', '#...#..#', '#...#..#', '########', '........'])
export const PixelCheck = make(['........', '.......#', '......##', '#....##.', '##..##..', '.####...', '..##....', '........'])
export const PixelPlus = make(['...##...', '...##...', '...##...', '########', '########', '...##...', '...##...', '...##...'])
export const PixelMinus = make(['........', '........', '........', '########', '########', '........', '........', '........'])
