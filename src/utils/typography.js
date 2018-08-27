import Typography from 'typography'
//import Wordpress2016 from 'typography-theme-wordpress-2016'
//import altonTheme from 'typography-theme-alton'
import kirkhamTheme from "typography-theme-kirkham";

// Wordpress2016.overrideThemeStyles = () => ({
//   'a.gatsby-resp-image-link': {
//     boxShadow: 'none',
//   },
// })

// delete Wordpress2016.googleFonts

const typography = new Typography(kirkhamTheme)

// Hot reload typography in development.
if (process.env.NODE_ENV !== 'production') {
  typography.injectStyles()
}

export default typography
