import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document'

class CustomHeaders extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render() {
    return (
      <Html>
        <Head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" />
          <link href="https://fonts.googleapis.com/css2?family=Nova+Flat&display=swap" rel="stylesheet" />
          {/* Video by Nico Becker: https://www.pexels.com/video/northern-lights-time-lapse-5700949/ */}
        </Head>
        {/* body {
          {innerHeight: '100%;'}
        } */}

        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default CustomHeaders