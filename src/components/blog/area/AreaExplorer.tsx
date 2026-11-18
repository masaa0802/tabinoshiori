"use client";

import { useState } from "react";

export type ExplorerGroup = {
  slug: string;
  name: string;
  count: number;
  areas: { slug: string; name: string; count: number }[];
};

export type ExplorerPanel = {
  slug: string;
  /** PC の背景地図（札つき） */
  wide: React.ReactNode;
  /** スマホの地図 */
  narrow: React.ReactNode;
  /** 地図の下に出す国の一覧 */
  list: React.ReactNode;
};

type AreaExplorerProps = {
  intro: React.ReactNode;
  groups: ExplorerGroup[];
  panels: ExplorerPanel[];
};

/**
 * 世界地図ページのエリア切り替え。地図はサーバーで描いたものを受け取り、表示の切り替えだけをする。
 * 記事のないエリアは「準備中」として押せないようにしている。
 */
const AreaExplorer: React.FC<AreaExplorerProps> = ({ intro, groups, panels }) => {
  const [active, setActive] = useState(panels[0]?.slug ?? "");
  const activeGroup = groups.find((group) => group.areas.some((area) => area.slug === active));
  const showSubAreas =
    activeGroup !== undefined && activeGroup.areas.filter((area) => area.count > 0).length > 1;

  const selectGroup = (group: ExplorerGroup) => {
    const first = group.areas.find((area) => area.count > 0);
    if (first) setActive(first.slug);
  };

  const subAreas = showSubAreas && activeGroup && (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={`${activeGroup.name}の小分け`}>
      {activeGroup.areas.map((area) => (
        <button
          key={area.slug}
          type="button"
          disabled={area.count === 0}
          aria-pressed={area.slug === active}
          onClick={() => setActive(area.slug)}
          className={`inline-flex min-h-9 items-center rounded-full border px-3.5 text-[13px] transition-colors ${
            area.slug === active
              ? "border-shu bg-[#fff7f2] font-bold text-shu"
              : area.count === 0
                ? "cursor-default border-dashed border-rule text-ink-muted/60"
                : "border-rule bg-paper-card/80 text-ink-soft hover:border-shu hover:text-shu"
          }`}
        >
          {area.name}
          {area.count > 0 && <span className="ml-1 text-xs">{area.count}</span>}
        </button>
      ))}
    </div>
  );

  const groupButton = (group: ExplorerGroup, layout: "column" | "row") => {
    const isActive = activeGroup?.slug === group.slug;
    const disabled = group.count === 0;
    return (
      <button
        key={group.slug}
        type="button"
        disabled={disabled}
        aria-pressed={isActive}
        onClick={() => selectGroup(group)}
        className={`flex min-h-11 items-center justify-between gap-4 rounded px-3.5 text-[15px] transition-colors ${
          layout === "column" ? "w-60" : "flex-shrink-0 border"
        } ${
          isActive
            ? "border-ink bg-ink text-paper"
            : disabled
              ? `cursor-default text-ink-muted/70 ${layout === "row" ? "border-dashed border-rule" : ""}`
              : `text-ink-soft hover:text-shu ${layout === "row" ? "border-rule bg-paper-card/85" : "hover:bg-paper-card/70"}`
        }`}
      >
        {group.name}
        <span className={`text-xs ${isActive ? "text-paper/80" : "text-ink-muted"}`}>
          {disabled ? "準備中" : `${group.count}記事`}
        </span>
      </button>
    );
  };

  return (
    <>
      {/* PC: 地図を背景いっぱいに敷き、左に見出しとエリアの一覧を重ねる */}
      <section className="relative hidden h-[760px] overflow-hidden lg:block">
        {panels.map((panel) => (
          <div
            key={panel.slug}
            className={`absolute inset-0 transition-opacity duration-500 ${
              panel.slug === active ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            aria-hidden={panel.slug !== active}
          >
            {panel.wide}
          </div>
        ))}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(244,239,230,0.95)_0,rgba(244,239,230,0.82)_calc(50%-180px),rgba(244,239,230,0)_calc(50%-60px)),linear-gradient(0deg,var(--color-paper)_0,rgba(244,239,230,0)_80px)]"
        />
        <div className="pointer-events-none relative mx-auto h-full max-w-5xl px-6 pt-14">
          <div className="pointer-events-auto w-[380px]">
            {intro}
            <nav aria-label="エリア" className="mt-7 flex flex-col gap-1">
              {groups.map((group) => (
                <div key={group.slug}>
                  {groupButton(group, "column")}
                  {activeGroup?.slug === group.slug && subAreas && (
                    <div className="w-64 py-2 pl-3.5">{subAreas}</div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>
      </section>

      {/* スマホ・タブレット: 見出し → エリアのタブ → 地図 */}
      <section className="lg:hidden">
        <div className="mx-auto max-w-xl px-4 pt-7">
          {intro}
          <nav
            aria-label="エリア"
            className="-mx-4 mt-5 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]"
          >
            {groups.map((group) => groupButton(group, "row"))}
          </nav>
          {subAreas && <div className="mt-2.5">{subAreas}</div>}
        </div>
        {panels.map((panel) => (
          <div key={panel.slug} hidden={panel.slug !== active} className="relative mx-auto max-w-xl">
            {panel.narrow}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-paper to-transparent"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-paper to-transparent"
            />
          </div>
        ))}
      </section>

      {panels.map((panel) => (
        <div key={panel.slug} hidden={panel.slug !== active}>
          {panel.list}
        </div>
      ))}
    </>
  );
};

export default AreaExplorer;
