import { useState } from "react";
import { musicEnabled, say, setMusic, unlock } from "../audio";
import { Icon } from "../Icon";
import { imgUrl, hasImg, lineUrl, type Pack, type Word } from "../pack";
import { bloomed, isAsleep, lessonDoneToday, resetProgress, todaysWords, useProgress, wakeUp } from "../progress";
import { go } from "../router";
import { LIMITS, playedToday, resetPlayToday, setDailyLimit, timeUp, useSettings } from "../settings";
import { MOVEMENTS } from "../movement";

/**
 * 家长中心 (Chinese, normal information density): what the child played today, offline play ideas
 * for those words, the garden, printable flashcards and settings. Reached through the parent gate.
 */
export function Parent({ pack }: { pack: Pack }) {
  const prog = useProgress();
  const settings = useSettings();
  const [music, setMusicOn] = useState(musicEnabled);
  const minutes = Math.round(playedToday() / 60000);
  const todayIds = todaysWords();
  const todayList = pack.words.filter((w) => todayIds.includes(w.id));
  const met = pack.words.filter((w) => prog.cards[w.id]);
  const recent = [...met].sort((a, b) => prog.cards[b.id].met - prog.cards[a.id].met).slice(0, 3);
  const tipWords = todayList.length ? todayList : recent;
  const flowers = met.filter((w) => bloomed(prog.cards[w.id])).length;

  const play = (w: Word) => {
    unlock();
    void say([lineUrl(pack.lang, w.id, "intro")]);
  };

  return (
    <main className="parent">
      <header className="parent-head">
        <button className="parent-back" onClick={() => go("home", "fade")}>
          ← 回到孩子模式
        </button>
        <h1>家长中心</h1>
      </header>

      <section className="p-card today">
        <div className="stat">
          <Icon name="clock" />
          <div>
            <b>{minutes} 分钟</b>
            <span>{settings.dailyLimit ? `今天已玩 · 上限 ${settings.dailyLimit} 分钟` : "今天已玩 · 不限时"}</span>
          </div>
        </div>
        <div className="stat">
          <Icon name="bud" />
          <div>
            <b>{todayList.length} 个词</b>
            <span>今天接触的词</span>
          </div>
        </div>
        <div className="stat">
          <Icon name="flower" />
          <div>
            <b>
              {flowers} / {met.length}
            </b>
            <span>开花 / 见过（共 {pack.words.length} 个）</span>
          </div>
        </div>
        <p className="today-note">
          {lessonDoneToday() ? "✓ 今天的学习已完成" : "今天还没完成学习，点首页的芽芽开始（约 8 分钟）"}
          {isAsleep() && " · 芽芽已经睡觉了"}
        </p>
      </section>

      <section className="p-card">
        <h2>{todayList.length ? "今天学的词 · 线下陪玩建议" : "最近学的词 · 线下陪玩建议"}</h2>
        <p className="p-sub">屏幕外的几句话，比多玩十分钟更有用。每天挑一条，在生活里自然地说出来就好。</p>
        {tipWords.length ? (
          <ul className="tips">
            {tipWords.map((w) => (
              <li key={w.id}>
                <button className="tip-art" onClick={() => play(w)} aria-label={`播放 ${w.en.word}`}>
                  {hasImg(w) ? <img src={imgUrl(w.id)} alt="" /> : <span>{w.emoji}</span>}
                </button>
                <div>
                  <h3>
                    <span className="en">{w.en.word}</span> {w.zh}
                    <button className="tip-play" onClick={() => play(w)} aria-label="播放">
                      <Icon name="speaker" />
                    </button>
                  </h3>
                  <p>{w.tip}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">还没有学过的词。陪孩子在首页点芽芽，上第一节课吧。</p>
        )}
      </section>

      <section className="p-card">
        <h2>花园</h2>
        {pack.themes.map((t) => (
          <div key={t.id} className="garden-row">
            <span className="theme-name">{t.zh}</span>
            <div className="chips">
              {pack.words
                .filter((w) => w.theme === t.id)
                .map((w) => {
                  const c = prog.cards[w.id];
                  const state = bloomed(c) ? "bloom" : c ? "bud" : "none";
                  return (
                    <button key={w.id} className={`chip ${state}`} onClick={() => play(w)} title={w.zh}>
                      {state !== "none" && <Icon name={state === "bloom" ? "flower" : "bud"} />}
                      <span className="en">{w.en.word}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
        <p className="p-sub">花苞 = 见过；开花 = 在两个不同的日子都一次就找对。系统按 1、2、4、7、14、30 天自动安排复习。</p>
      </section>

      <section className="p-card">
        <h2>跟着动 · 一起模仿小动物</h2>
        <p className="p-sub">先听英语、看芽芽示范，再留出时间一起模仿。可以站着或坐着玩；做完由孩子点箭头继续，系统不识别或评判动作。</p>
        <ul className="tips">
          {MOVEMENTS.map((action) => (
            <li key={action.id}>
              <div>
                <h3 className="en">{action.instruction}</h3>
                <p>{action.hintZh}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="p-actions">
          <button onClick={() => go(timeUp() ? "night" : "move", "in")}><Icon name="move" /> 一起玩 4 个动作</button>
        </div>
      </section>

      <section className="p-card">
        <h2>可打印闪卡</h2>
        <p className="p-sub">A4 纸一页 6 张，剪开后可以玩“找一找”“藏起来”，或者贴在对应的东西上。</p>
        <div className="p-actions">
          <button onClick={() => go("cards/met", "fade")} disabled={!met.length}>
            <Icon name="print" /> 学过的词（{met.length}）
          </button>
          <button onClick={() => go("cards/all", "fade")}>
            <Icon name="print" /> 全部词（{pack.words.length}）
          </button>
        </div>
      </section>

      <section className="p-card">
        <h2>设置</h2>
        <div className="setting">
          <span>每日时长上限</span>
          <div className="seg">
            {LIMITS.map((m) => (
              <button key={m} className={settings.dailyLimit === m ? "on" : ""} onClick={() => setDailyLimit(m)}>
                {m ? `${m} 分钟` : "不限"}
              </button>
            ))}
          </div>
        </div>
        <p className="p-sub">到时间芽芽会打哈欠说晚安，进入晚安模式，当天不再开始新的一轮。2–5 岁建议每天屏幕时间不超过 1 小时，并尽量陪着一起玩。</p>
        <div className="setting">
          <span>背景音乐</span>
          <div className="seg">
            <button
              className={music ? "on" : ""}
              onClick={() => {
                setMusic(true);
                setMusicOn(true);
              }}
            >
              开
            </button>
            <button
              className={!music ? "on" : ""}
              onClick={() => {
                setMusic(false);
                setMusicOn(false);
              }}
            >
              关
            </button>
          </div>
        </div>
        <div className="p-actions">
          {isAsleep() && (
            <button
              onClick={() => {
                wakeUp();
                resetPlayToday();
              }}
            >
              叫醒芽芽（时长清零）
            </button>
          )}
          <button onClick={() => resetPlayToday()}>今天的时长清零</button>
          <button className="danger" onClick={() => confirm("确定清空全部学习进度和花园吗？此操作不能撤销。") && resetProgress()}>
            清空学习进度
          </button>
        </div>
      </section>

      <footer className="parent-foot">
        <p>隐私：没有账号，不收集任何信息，学习记录只保存在这台设备上。</p>
        <a href="#/review">样片验收（开发用）</a>
      </footer>
    </main>
  );
}

/** Printable flashcards, 6 per A4 page. */
export function Cards({ pack, which }: { pack: Pack; which: string }) {
  const prog = useProgress();
  const words = which === "met" ? pack.words.filter((w) => prog.cards[w.id]) : pack.words;
  return (
    <main className="cards-page">
      <div className="cards-bar">
        <button onClick={() => go("parent", "fade")}>← 返回家长中心</button>
        <span>
          {words.length} 张 · {Math.ceil(words.length / 6)} 页 A4
        </span>
        <button className="primary" onClick={() => window.print()}>
          <Icon name="print" /> 打印
        </button>
      </div>
      <div className="cards-grid">
        {words.map((w) => (
          <div key={w.id} className="flashcard">
            {hasImg(w) ? <img src={imgUrl(w.id)} alt="" /> : <span className="fc-emoji">{w.emoji}</span>}
            <div className="fc-word">{w.en.word}</div>
            <div className="fc-zh">{w.zh}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
