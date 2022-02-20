import { GetStaticPaths, GetStaticProps } from 'next';

import { nanoid } from 'nanoid';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Link from 'next/link';
import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';
import { Comments } from '../../components/Comments';
import { ExitPreviewButton } from '../../components/ExitPreviewButton';
import { PreviewDataType } from '../../types';

interface Post {
  first_publication_date: string | null;
  editDate: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

type AnotherPost = {
  uid: string;
  title: string;
} | null;

interface PostProps {
  post: Post;
  preview: boolean;
  prevPost: AnotherPost;
  nextPost: AnotherPost;
}

export default function Post({
  post,
  preview,
  prevPost,
  nextPost,
}: PostProps): JSX.Element {
  const router = useRouter();

  const readingTime = Math.ceil(
    post.data.content
      .reduce((acc, el) => {
        return acc + RichText.asText(el.body);
      }, '')
      .split(' ').length / 200
  );

  const content = post.data.content.map(el => ({
    ...el,
    uid: nanoid(),
  }));

  return router.isFallback ? (
    <main className={styles.loading}>Carregando...</main>
  ) : (
    <main className={`${commonStyles.container} ${styles.container}`}>
      <Header />

      <img className={styles.banner} src={post.data.banner.url} alt="banner" />

      <h1>{post.data.title}</h1>

      <div className={commonStyles.postInfo}>
        <figure>
          <FiCalendar size={18} />
          {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
            locale: ptBR,
          })}
        </figure>
        <figure>
          <FiUser size={18} />
          {post.data.author}
        </figure>
        <figure>
          <FiClock size={18} /> {readingTime} min
        </figure>
      </div>

      {post.editDate && (
        <small className={styles.edited}>{post.editDate}</small>
      )}

      <article className={styles.post}>
        {content.map(el => (
          <section key={el.uid}>
            <h2>{el.heading}</h2>

            <div
              className={styles.postContent}
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: RichText.asHtml(el.body) }}
            />
          </section>
        ))}
      </article>

      <hr className={styles.dividingLine} />

      <div className={styles.containerOfOtherPosts}>
        {prevPost && (
          <Link href={`/post/${prevPost.uid}`}>
            <a className={styles.prevPost}>
              <h3>{prevPost.title}</h3>
              <small>Post anterior</small>
            </a>
          </Link>
        )}

        {nextPost && (
          <Link href={`/post/${nextPost.uid}`}>
            <a className={styles.nextPost}>
              <h3>{nextPost.title}</h3>
              <small>Próximo post</small>
            </a>
          </Link>
        )}
      </div>

      <Comments />

      {preview && <ExitPreviewButton />}
    </main>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'post'),
  ]);

  const uids = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths: uids,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps<PostProps> = async ({
  params,
  previewData,
  preview = false,
}) => {
  const { slug } = params;

  const previewDataFormatted = previewData as PreviewDataType;

  const previewRef = previewDataFormatted ? previewDataFormatted.ref : null;
  const refOption = previewRef ? { ref: previewRef } : null;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), refOption);

  const prevPostData = (
    await prismic.query(Prismic.predicates.at('document.type', 'post'), {
      fetch: ['post.title'],
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
    })
  ).results[0];

  const nextPostData = (
    await prismic.query(Prismic.predicates.at('document.type', 'post'), {
      fetch: ['post.title'],
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date desc]',
    })
  ).results[0];

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    editDate:
      response.first_publication_date === response.last_publication_date
        ? null
        : format(
            new Date(response.last_publication_date),
            "'* editado em' dd MMM yyyy, 'ás' k:m",
            {
              locale: ptBR,
            }
          ),
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };

  const prevPost = prevPostData
    ? {
        uid: prevPostData.uid,
        title: prevPostData.data.title,
      }
    : null;

  const nextPost = nextPostData
    ? {
        uid: nextPostData.uid,
        title: nextPostData.data.title,
      }
    : null;

  return {
    props: {
      post,
      preview,
      prevPost,
      nextPost,
    },
  };
};
