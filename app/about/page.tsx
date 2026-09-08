import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  Mail,
  GraduationCap,
  BriefcaseBusiness,
} from "lucide-react";
import { countEditedBooks, getEditedBooksData } from "@/lib/edited-books";
import profile from "@/data/profile.json";
import styles from "./about.module.css";
import { BookShelf, FeaturedBooks } from "@/components/FeaturedBooks";
import { getLectureHighlights, getSelectedBooks } from "@/lib/editorial-content";
export const metadata = {
  title: "편집자P 소개와 강의 문의 | 박현규",
  description:
    "IT 도서 기획·편집자이자 개발자 박현규, 편집자P의 이야기. 집필 도서, 편집한 책, 주요 강의 이력과 강의 문의를 만나보세요.",
};
export default function AboutPage() {
  const totalBooks = countEditedBooks(getEditedBooksData());
  const featuredUrls = new Set(getSelectedBooks().map((book) => book.url));
  const otherBooks = profile.books.filter((book) => !featuredUrls.has(book.url));
  // 연도별로 묶은 타임라인. profile.lectures는 최신순으로 정렬되어 있다.
  const timeline = profile.lectures.reduce<
    { year: string; items: typeof profile.lectures }[]
  >((groups, lecture) => {
    const year = lecture.date.slice(0, 4);
    const last = groups[groups.length - 1];
    if (last?.year === year) last.items.push(lecture);
    else groups.push({ year, items: [lecture] });
    return groups;
  }, []);
  const formatDay = (date: string) =>
    date
      .replace(" 예정", "")
      .replace(/^\d{4}-?/, "")
      .replace(/^(\d{2})-(\d{2})/, "$1.$2");
  return (
    <div className={`container ${styles.page}`}>
      <nav className={styles.sectionNav} aria-label="소개 목차">
        <a href="#story">소개</a>
        <a href="#authored-books">집필 도서</a>
        <a href="#lectures">강의 이력</a>
        <a href="#profile">프로필</a>
        <a href="#contact">강의 문의</a>
      </nav>
      <section className={styles.hero} id="story">
        <div>
          <div className={styles.identity}>
            <Image src="/p.png" alt="" width={56} height={56} />
            <span>
              IT 도서 기획·편집자<strong>박현규 / 편집자P</strong>
            </span>
          </div>
          <h1>
            책으로 정리하고,
            <br />
            <span>강의와 실습으로 나눕니다.</span>
          </h1>
          <p>
            개발이 취미인 IT 도서 기획·편집자입니다. 직접 쓰고 기획한 AI 도서,
            기업과 학교에서 진행한 강의, 업무에 적용한 자동화 경험을 소개합니다.
          </p>
          <div className={styles.heroFacts}>
            <span>
              <strong>{totalBooks}권</strong> 도서 참여
            </span>
            <span>
              <strong>{profile.lectures.length}건</strong> 주요 강의 기록
            </span>
          </div>
          <a href="#contact" className="btn btn-primary">
            강의·협업 문의 <ArrowUpRight size={16} />
          </a>
        </div>
        <BookShelf priority />
      </section>
      <section className={styles.books} id="authored-books">
        <div className={styles.sectionHeading}>
          <div>
            <h2>직접 쓰고 기획한 대표 도서</h2>
            <p>도서별 참여 역할과 함께 볼 수 있는 강의를 연결했습니다.</p>
          </div>
          <Link href="/edited-books">
            전체 {totalBooks}권 보기 <ArrowRight size={15} />
          </Link>
        </div>
        <FeaturedBooks />
        <div className={styles.otherBooks}>
          <h3>그 외 집필·편저서 {otherBooks.length}권</h3>
          <div className={styles.bookList}>
            {otherBooks.map((book) => (
              <a
                key={book.url}
                href={book.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <BookOpen size={15} />
                <span>{book.title}</span>
                <ArrowUpRight size={14} />
              </a>
            ))}
          </div>
        </div>
      </section>
      <section className={styles.lectures} id="lectures">
        <div className={styles.sectionHeading}>
          <div>
            <h2>업무와 현장에 맞춘 AI 강의</h2>
            <p>
              기업 실무부터 교사 연수와 공공기관 강의까지, 실제 진행한
              사례입니다.
            </p>
          </div>
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
        <ol className={styles.timeline}>
          {timeline.map((group) => (
            <li key={group.year} className={styles.timelineYear}>
              <span className={styles.yearLabel}>{group.year}</span>
              <ol>
                {group.items.map((lecture, index) => (
                  <li key={`${lecture.date}-${index}`}>
                    <time dateTime={lecture.date.slice(0, 10)}>
                      {formatDay(lecture.date)}
                    </time>
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
          <h2>
            책에서 영상으로,
            <br />
            배운 것을 일상으로.
          </h2>
          <p>
            사내에서 사용하는 자동화 앱을 파이썬과 자바스크립트로 직접 개발해
            활용합니다. IT 지식을 더 쉽게 나누기 위해 책을 쓰고, 유튜브 영상을
            만들고, ai100.co.kr을 운영합니다.
          </p>
          <p>
            이 공간에는 강의의 순서와 연결을 담았습니다. 처음 배우는 분도 작은
            결과물을 완성하고 다음 공부를 이어갈 수 있도록요.
          </p>
          <div className={styles.credentials}>
            <span>
              <BookOpen size={18} />
              <strong>{totalBooks}권</strong>의 책에 참여
            </span>
            <span>
              <GraduationCap size={18} />
              <strong>{profile.lectures.length}건</strong>의 주요 강의 기록
            </span>
          </div>
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
          <BriefcaseBusiness size={25} />
          <span>
            <strong>커서 공식 앰배서더</strong>
            <small>직접 사용하고, 만들고, 경험을 나눕니다.</small>
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
          <span>공부를 시작한 과정이 궁금하다면</span>
          <h2>편집자P의 공부 이야기</h2>
          <p>유튜브에서 소개 영상 보기</p>
        </div>
        <ArrowUpRight size={22} />
      </a>
      <section id="contact" className={styles.contact}>
        <Mail size={28} />
        <h2>우리 팀에도, 배움의 계기가 필요하다면.</h2>
        <p>
          AI 입문부터 바이브 코딩, 실무 자동화까지.
          <br />
          대상과 주제, 희망 일정을 함께 보내주시면 이야기 나누겠습니다.
        </p>
        <a className="btn btn-primary" href="mailto:hgpark@goldenrabbit.co.kr">
          강의 문의 이메일 보내기 <ArrowUpRight size={17} />
        </a>
        <a className={styles.email} href="mailto:hgpark@goldenrabbit.co.kr">
          hgpark@goldenrabbit.co.kr
        </a>
      </section>
    </div>
  );
}
