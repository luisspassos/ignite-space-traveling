import { GetStaticPaths, GetStaticProps } from 'next';

import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

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
  const readingTime = post.data.content.reduce((acc, el) => {
    let a = '';
    a += RichText.asText(el.body);

    return a;
  }, '');

  console.log(readingTime);

  return (
    <article>
      <h1>{post.data.title}</h1>
      <time>
        {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
          locale: ptBR,
        })}
      </time>
      <span>{post.data.author}</span>
    </article>
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

  console.log(JSON.stringify(post, null, 2));

  return {
    props: {
      post,
    },
  };
};
