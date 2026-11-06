import { useState } from "react";
import { say, unlock } from "../audio";
import { globalUrl, hasImg, lineUrl, type Line, type Pack } from "../pack";
import { bloomed, isAsleep, resetProgress, skipDay, today, useProgress, wakeUp } from "../progress";
import { Sticker } from "../Sticker";

const LINES: { key: Line; label: string; who: string }[] = [
  { key: "word", label: "单词", who: "老师·慢" },
  { key: "intro", label: "出场", who: "老师" },
  { key: "say", label: "互动", who: "芽芽" },
  { key: "find", label: "提问", who: "老师" },
  { key: "found", label: "找对", who: "老师" },
  { key: "that", label: "点错", who: "老师" },
  { key: "bye", label: "再见", who: "老师" },
];

/** For the grown-ups: every sticker and every recorded line, to check the sample by ear and eye. */
export function Review({ pack }: { pack: Pack }) {
  const [playing, setPlaying] = useState("");
  const play = async (key: string, url: string) => {
    unlock();
    setPlaying(key);
    await say([url]);
    setPlaying((p) => (p === key ? "" : p));
  };
  const imgs = pack.words.filter(hasImg).length;
  const prog = useProgress();
  const d = today();
  const met = pack.words.filter((w) => prog.cards[w.id]);

  return (
    <main className="review">
      <header>
        <a href="#/home" className="review-back">← 回到孩子模式</a>
        <h1>试用验收 · 最小可玩版</h1>
        <p>
          {pack.words.length} 个词 · 插画 {imgs}/{pack.words.length}
          {imgs < pack.words.length && "（没有插画的先用表情符号占位）"} · 每词 7 段配音
        </p>
      </header>
      <section className="review-progress">
        <h2>学习进度（测试用）</h2>
        <p>
          {prog.dayOffset ? `模拟第 ${prog.dayOffset + 1} 天 · ` : ""}见过 {met.length} 个词 · 开花 {met.filter((w) => bloomed(prog.cards[w.id])).length} 朵 ·
          今天{prog.lessonDay === d ? "已" : "还没"}完成学习{isAsleep() ? " · 芽芽已睡觉" : ""}
        </p>
        <div className="review-tools">
          <button onClick={() => skipDay()}>⏭ 跳到明天</button>
          {isAsleep() && <button onClick={() => wakeUp()}>☀️ 叫醒芽芽</button>}
          <button onClick={() => confirm("清空全部学习进度？") && resetProgress()}>🗑 清空进度</button>
        </div>
        {met.length > 0 && (
          <ul className="review-cards">
            {met.map((w) => {
              const c = prog.cards[w.id];
              return (
                <li key={w.id}>
                  {bloomed(c) ? "🌸" : "🌱"} {w.en.word} · 盒子 {c.box} · {c.due <= d ? "今天要复习" : `${c.due - d} 天后复习`}
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section className="review-global">
        <h2>通用语音</h2>
        {pack.global.map((k) => (
          <button key={k} className={playing === `g-${k}` ? "on" : ""} onClick={() => play(`g-${k}`, globalUrl(pack.lang, k))}>
            ▶ {k}
          </button>
        ))}
      </section>
      {pack.themes.map((t) => (
        <section key={t.id}>
          <h2>
            {t.emoji} {t.zh}
          </h2>
          <div className="review-grid">
            {pack.words
              .filter((w) => w.theme === t.id)
              .map((w) => (
                <article key={w.id} className="review-card">
                  <Sticker word={w} label={false} onTap={() => play(`${w.id}-intro`, lineUrl(pack.lang, w.id, "intro"))} />
                  <h3>
                    {w.en.word} <span>{w.zh}</span>
                  </h3>
                  <ul>
                    {LINES.map((l) => {
                      const key = `${w.id}-${l.key}`;
                      return (
                        <li key={l.key}>
                          <button className={playing === key ? "on" : ""} onClick={() => play(key, lineUrl(pack.lang, w.id, l.key))}>
                            ▶
                          </button>
                          <span className="tag">
                            {l.label}·{l.who}
                          </span>
                          <span className="text">{w.en[l.key]}</span>
                        </li>
                      );
                    })}
                  </ul>
                </article>
              ))}
          </div>
        </section>
      ))}
    </main>
  );
}
