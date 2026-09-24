import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { countEditedBooks, getEditedBooksData } from "@/lib/edited-books";
import profile from "@/data/profile.json";
import styles from "./about.module.css";
import { AuthoredBooks, JoinedBooks } from "@/components/Library";
import { getAuthoredBooks, getLectureHighlights } from "@/lib/editorial-content";
import { Character } from "@/components/Character";
export const metadata = {
  title: "소개 | 편집자P의 AI 서재",
  description:
    "IT 도서 기획·편집자이자 개발자 박현규, 편집자P의 이야기. 집필 도서, 편집한 책, 주요 강의 이력과 강의 문의를 만나보세요.",
};
export default function AboutPage() {
  const totalBooks = countEditedBooks(getEditedBooksData());
  const publishers = getEditedBooksData().publishers.map((p) => p.name).sort().join("과 ");
  const authoredCount = getAuthoredBooks().length;
  // 연도별로 묶은 타임라인. profile.lectures는 최신순으로 정렬되어 있다.
  const byYear = (list: typeof profile.lectures) =>
    list.reduce<{ year: string; items: typeof profile.lectures }[]>((groups, lecture) => {
      const year = lecture.date.slice(0, 4);
      const last = groups[groups.length - 1];
      if (last?.year === year) last.items.push(lecture);
      else groups.push({ year, items: [lecture] });
      return groups;
    }, []);
  const RECENT = 8;
  const recent = byYear(profile.lectures.slice(0, RECENT));
  const older = byYear(profile.lectures.slice(RECENT));
  return (
    <div className={`container ${styles.page}`}>
      <nav className={styles.sectionNav} aria-label="소개 목차">
        <a href="#story">소개</a>
        <a href="#authored-books">책</a>
        <a href="#lectures">강의 이력</a>
        <a href="#profile">프로필</a>
        <a href="#contact">강의 문의</a>
      </nav>
      <section className={styles.hero} id="story">
        <div>
          <h1>박현규 · 편집자P</h1>
          <p>
            개발이 취미인 IT 도서 기획·편집자입니다. {publishers}에서 IT 책{" "}
            <b className="mark">{totalBooks}권</b>을 기획하고 편집했고, 그중 {authoredCount}권은 직접 썼습니다.
            기업·학교·공공기관에서 AI 도구를 가르치며 지금까지 강의 {profile.lectures.length}건을 진행했습니다.
          </p>
          <a href="#contact" className="btn btn-primary">
            강의·협업 문의
          </a>
        </div>
      </section>
      <section className={styles.books} id="authored-books">
        <div className={styles.sectionHeading}>
          <div>
            <h2>책</h2>
            <p>직접 쓴 책과 기획·편집으로 참여한 책입니다. 영상 강의가 있는 책은 관련 강의로 이어집니다.</p>
          </div>
          <Character id="library-books" height={96} />
        </div>
        <AuthoredBooks />
        <JoinedBooks />
      </section>
      <section className={styles.lectures} id="lectures">
        <div className={styles.sectionHeading}>
          <div>
            <h2>강의 이력</h2>
            <p>기업 실무, 교사 연수, 공공기관 강의를 진행했습니다.</p>
          </div>
          <Character id="about-lecture" height={120} />
        </div>
        <div className={styles.lectureHighlights}>
          {getLectureHighlights().map((item) => (
            <article key={item.label}>
              <span>{item.label}</span>
              <h3>{item.org}</h3>
              <p>{item.title.replaceAll("—", "-")}</p>
              <time>{item.date.replace(" 예정", "")}</time>
            </article>
          ))}
        </div>
        <div className={styles.timelineHeading}>
          <h3>강의 타임라인</h3>
          <p>{profile.lectures.length}건 · 최신순</p>
        </div>
        <Timeline groups={recent} />
        {older.length > 0 && (
          <details className={styles.olderLectures}>
            <summary>이전 강의 {profile.lectures.length - RECENT}건 더 보기</summary>
            <Timeline groups={older} />
          </details>
        )}
        <a
          className={styles.historyLink}
          href="https://docs.google.com/document/d/1bZ1TlO8acV-tytns-vXeQ_EP_RXNXvG2kYiKZQzku8g/edit?tab=t.0"
          target="_blank"
          rel="noopener noreferrer"
        >
          전체 강의 이력 원문 <ArrowUpRight size={14} />
        </a>
      </section>
      <section className={styles.bio} id="profile">
        <div>
          <h2>프로필</h2>
          <p>
            사내에서 사용하는 자동화 앱을 파이썬과 자바스크립트로 직접 개발해
            활용합니다. IT 지식을 더 쉽게 나누기 위해 책을 쓰고, 유튜브 영상을
            만들고, ai100.co.kr을 운영합니다.
          </p>
          <p>
            이 공간에는 강의의 순서와 연결을 담았습니다. 처음 배우는 분도 작은
            결과물을 완성하고 다음 공부를 이어갈 수 있도록요.
          </p>
        </div>
        <dl className={styles.profile}>
          <div>
            <dt>이름</dt>
            <dd>박현규 (편집자P)</dd>
          </div>
          <div>
            <dt>학력</dt>
            <dd>
              건국대학교 컴퓨터공학 졸업
              <br />
              <small>소프트웨어 공학 전공</small>
            </dd>
          </div>
          <div>
            <dt>소속·직책</dt>
            <dd>골든래빗 / 팀장</dd>
          </div>
          <div>
            <dt>주요 경력</dt>
            <dd>
              2023 ~ 현재 골든래빗 팀장
              <br />
              2017 ~ 2023 이지스퍼블리싱 팀장
            </dd>
          </div>
          <div>
            <dt>이메일</dt>
            <dd>
              <a href="mailto:hgpark@goldenrabbit.co.kr">
                hgpark@goldenrabbit.co.kr
              </a>
            </dd>
          </div>
          <div>
            <dt>유튜브</dt>
            <dd>
              <a
                href="https://www.youtube.com/@editorp89"
                target="_blank"
                rel="noopener noreferrer"
              >
                @editorp89 <ArrowUpRight size={13} />
              </a>
            </dd>
          </div>
        </dl>
      </section>
      <div className={styles.ambassador}>
        <div>
          <span>
            <strong>커서 공식 앰배서더</strong>
          </span>
        </div>
        <Image
          src="/cursor-ambassador.png"
          alt="커서 공식 앰배서더 인증 이미지"
          width={230}
          height={130}
          style={{ objectFit: "contain", height: "auto" }}
        />
      </div>
      <a
        className={styles.storyVideo}
        href="https://www.youtube.com/watch?v=BX5jpMul804"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div className={styles.storyImage}>
          <Image
            src="/learning/BX5jpMul804.jpg"
            alt=""
            fill
            sizes="(max-width:640px) 90vw, 280px"
          />
        </div>
        <div>
          <h2>편집자P의 공부 이야기</h2>
          <p>유튜브에서 소개 영상 보기</p>
        </div>
        <ArrowUpRight size={22} />
      </a>
      <section id="contact" className={styles.contact}>
        <Character id="contact-letter" height={120} align="center" />
        <h2>강의·협업 문의</h2>
        <p>
          AI 입문, 바이브 코딩, 업무 자동화 강의를 합니다. 대상과 주제, 희망 일정을 보내주시면 답장드리겠습니다.
        </p>
        <a className="btn btn-primary" href="mailto:hgpark@goldenrabbit.co.kr">
          이메일 보내기
        </a>
        <a className={styles.email} href="mailto:hgpark@goldenrabbit.co.kr">
          hgpark@goldenrabbit.co.kr
        </a>
      </section>
    </div>
  );
}

function Timeline({ groups }: { groups: { year: string; items: typeof profile.lectures }[] }) {
  const formatDay = (date: string) =>
    date
      .replace(" 예정", "")
      .replace(/^\d{4}-?/, "")
      .replace(/^(\d{2})-(\d{2})/, "$1.$2");
  return (
    <ol className={styles.timeline}>
      {groups.map((group) => (
        <li key={group.year} className={styles.timelineYear}>
          <span className={styles.yearLabel}>{group.year}</span>
          <ol>
            {group.items.map((lecture, index) => (
              <li key={`${lecture.date}-${index}`}>
                <time dateTime={lecture.date.slice(0, 10)}>{formatDay(lecture.date)}</time>
                <div>
                  <h4>{lecture.title.replaceAll("—", "-")}</h4>
                  <p>{lecture.org}</p>
                </div>
              </li>
            ))}
          </ol>
        </li>
      ))}
    </ol>
  );
}
