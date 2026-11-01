export const Pager = ({ p, set }: { p: any; set: (n: number) => void }) => p && p.tongTrang > 1 ? (
  <div className="pager"><button className="btn ghost" disabled={p.trang === 0} onClick={() => set(p.trang - 1)}>Trước</button>
    <span>Trang {p.trang + 1}/{p.tongTrang}</span>
    <button className="btn ghost" disabled={p.trang + 1 >= p.tongTrang} onClick={() => set(p.trang + 1)}>Sau</button></div>) : null;
