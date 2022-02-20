import { GetStaticPaths, GetStaticProps } from 'next';

import { nanoid } from 'nanoid';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';
import { Comments } from '../../components/Comments';

interface Post {
  first_publication_date: string | null;
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

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
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

      <article className={styles.post}>
        {content.map(el => (
          <section key={el.uid}>
            <h2>{el.heading}</h2>

            <div
              className={styles.postContent}
              dangerouslySetInnerHTML={{ __html: RichText.asHtml(el.body) }}
            />
          </section>
        ))}
      </article>

      <hr className={styles.dividingLine} />
      <Comments />
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

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  console.log(response);

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
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

  return {
    props: {
      post,
    },
  };
};
