/**
 * ブログのセクション見出し。明朝の見出しの右に、ノートの点線を引く。
 */
type SectionHeadingProps = {
  children: React.ReactNode;
  id?: string;
};

const SectionHeading: React.FC<SectionHeadingProps> = ({ children, id }) => {
  return (
    <h2 id={id} className="mb-5 flex items-center gap-4 font-mincho text-xl font-extrabold text-ink sm:text-2xl">
      {children}
      <span aria-hidden="true" className="flex-1 border-t border-dashed border-ink-muted/50" />
    </h2>
  );
};

export default SectionHeading;
