const path = require('path');
const express = require('express');
const serveIndex = require('serve-index');
const { buildSchema } = require('graphql');
const { graphqlHTTP } = require('express-graphql'); // middleware function which responds to graphql queries
const mongoose = require("mongoose");
const { makeExecutableSchema } = require('@graphql-tools/schema'); // to combine multiple schema
const { loadFilesSync } = require('@graphql-tools/load-files');  // to make schema available in the graphql env
const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const fs = require("fs").promises;
// const epubParser = require("epub-parser");
// const  ePub = require("epubjs");
const mobi = require('mobi');
const PDFParser = require('pdf-parse');
// const pdf2html = require('pdf2html');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();


///////////////////////////////////////////////////////////////////db//////////////////////////////////
// const typesArray = loadFilesSync(path.join(__dirname, '*/.graphql')); // on travaillera dessus plustard! ca va remplacer schemaText
// const resolversArray = loadFilesSync(path.join(__dirname, '**/*resolvers.js'));
////////////////////////////////////////////////////////////////////Version 1////////////////////////////////////////////////////////





/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const typesArray= loadFilesSync('*/', {
  extensions: ['graphql'],
});
const root =
 [
    {
    _id: '77777',
    title: 'titre'
  },
  {
    _id: '77778',
    title: 'titre2'
  }
];

const schemaText = `#graphql
  type Query {
    books: [Book]
    booksByTitle(title: String!): [Book]
  }
  type Book {
    _id: ID
    title: String!
  }
`;

function getBookByTitle(title){
  root.filter((book) => {
    return book.title = title;
  })
}
// book resolver
// args, filter products based on certain conditions
// context, used to share data across all of our resolvers, for exple for passing down 
// authentication data to every of our resolvers
// info contains information about the states of our operation
// Resolvers can now make API call or asynchronous database operations
// Resolvers are way for accessing our data
// args isthe key to create filtered queries

const schema = makeExecutableSchema({
  typeDefs: [schemaText],
  resolvers: {
    Query: {
      books: async (parent, args, context, info) => {
        console.log('Getting the books...');
        console.log(parent);
        // return parent.books;
        const books = await Promise.resolve(parent);
        return books;
      },
      booksByTitle: (_, args) => {
        return getBookByTitle(args.title);
      }
    }
  }
}) 


const oplogRsSchema = mongoose.Schema({
  title:{type: String, required:true}
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// const schema = buildSchema(`
//   type Query {
//     books: [Book]
//   }
//   type Book {
//     _id: ID!
//     title: String!
//   }
// `);



mongoose.set("strictQuery", false);
const mongoDB = process.env.MONGO_URI

let connection = null;
// main().catch((err) => console.log(err));

function main(){
   mongoose.connect(mongoDB);
  connection = mongoose.connection;
 connection.on('open', function() {
  console.log('database is connected successfully');
  // console.log(connection.db);
 }); 
 mongoose.connection.on('error', (err) => console.log('Connection failed with - ',err));
};

try {
    main()
} catch (error) {
  throw error;
}

///////////////////////////////////////////////////////////////////////////
const app = express();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods","DELETE, POST, GET, OPTIONS");
  next();
});

app.use(express.json()); // For parsing JSON bodies
app.use(express.urlencoded({ extended: true })); // For parsing URL-encoded bodies

app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true
}));

app.use((req, res, next) => {
  console.log('Time: ', Date.now());
  next();
});

app.use('/request-type', (req, res, next) => {
  console.log('Request type: ', req.method);
  next();
});

app.use('/public', express.static('public'));
app.use('/public', serveIndex('public'));

app.get('/all_books', async (req, res) => {
  console.log("ooooo");

  // find() is returnning a cursor on all documents, we need to iterate through the cusor to get each document
  const results = await connection && connection.db.collection('books').find();
  // results.next( doc => console.log(doc));
  for (let doc = await results.next(); doc != null; doc = await results.next()) {
    console.log(doc);
    /* set and save */
  }
    res.status(200).json({data_sq: results.data});
  });
  app.get('/book/:book_id', async (req, res) => {
    console.log(req.params.book_id);
    var book_id = req.params.book_id;

    const results = await connection && connection.db.collection('books').findOne({_id: new ObjectId(`${req.params.book_id}`)});
    results.then( doc => console.log(doc));
      res.status(200).json({data_sq: results.data});
    });
  
app.get('/', (req, res) => {
  const ObjectID = require('mongodb').ObjectId;
  const obj =  {title: "test", _id: new ObjectID()};
  // const FirstObj = mongoose.model('Persons', oplogRsSchema);
  connection && connection.db.collection('books').insertOne(obj).then(() => {
    res.send('Successful response.');
});

});

///////////////////////////////////////////////////graphQL apollo/////////////////
const typeDefs = `#graphql
  type Query {
    greeting: String
  }
`;

const resolvers = {
  Query: {
    greeting: () => 'Hello world',
  },
};

const server = new ApolloServer({typeDefs, resolvers });

// const graphqlServ = (async () => 
// {
//    const { url } = await startStandaloneServer(server, {listen: {port: 9000}});
//    console.log(`Server running at ${url}`);
// })();
///////////////////////////////////////////////////////////////////////////
// app.use(express.static('./assets'));
//////////////////////////////////////////////
// const epub_handler = () => {
//     // const epubFile = fs.readFileSync('./assets/test2.epub');
//     const epubFile = new ePub('./assets/test2.epub');

//     // console.log(epubFile);
//     // epubParser.open(epubFile,((err,book) => {
//     //     const firstChapter = book.spine[10].getHtml();
//     //     console.log(firstChapter);
//     //}));

//     // const book = new epubParser(epubFile);
//     // book.ready.then(() => {
//     //     console.log(book);
//     // })
//     // epubFile.ready.then(() => {

//     // })
// }

// epub_handler();

////////////////////////////////////////////
async function parseMobi(filePath) {
    try {
    //  const mobiFile = await fs.readFile(filePath);      
     const book = new mobi(filePath);
     book.open(filePath, (err, book) => {

     });

     console.log(book.cover && book.cover.getDataUrl());    
      
    } catch (error) {
      console.error('Error parsing Mobi:', error.message);
    }
  }

/////////////////////////////////
// async function parseEPUB(filePath) {
//     try {
//     //   const epubFile = await fs.readFile(filePath, 'utf8');
      
//       const epub = ePub(filePath);
//     //   console.log(epub);
      
//       // Get the spine (table of contents)
 
//       const spine = epub && epub.spine;
//       console.log(spine);

//       // Iterate through the spine to access chapters
//       for (let i = 0; i < spine && spine.length; i++) {
//         const itemRef = spine[i];
//         console.log(itemRef);
        
//         // Check if the item is a chapter
//         if (itemRef.type === 'document') {
//           const chapterContent = await epub.read(itemRef.href);
          
//           console.log(`Chapter ${i + 1}:`);
//           console.log(chapterContent.toString());
//           console.log('\n');
//         }
//       }
      
//       console.log('EPUB parsing completed successfully.');
//     } catch (error) {
//       console.error('Error parsing EPUB:', error.message);
//     }
//   }
  
  // Usage
//   parseMobi('./assets/bible.mobi');

const pdfParser = async (filePath) => {
    try {
            
      // Read the PDF file
      const dataBuffer = await fs.readFile(filePath);
      
      // Parse the PDF
      const data = await PDFParser(dataBuffer);
      
      // Process the PDF content (example: extract text)
      const extractedText = data.text;
      console.log(extractedText);
      
      // Send the result
    } catch (error) {
        console.log(error);
    }
  };

//   pdfParser('./assets/test3.pdf');

///////////////////////////////////////////
// app.get('/pdf-to-html', async (req, res) => {
//     try {
      
//       // Read the PDF file
//       const dataBuffer = await fs.readFile('./assets/test3.pdf');
      
//       // Parse the PDF
//       const data = await PDFParser(dataBuffer);
      
//       // Convert PDF to HTML
//       const options = {
//         pagesPerFile: 1,
//         outputFolder: './output',
//         fileName: 'converted'
//       };
//       await pdf2html.pages(dataBuffer, options);
      
//       // Read the converted HTML file
//       const htmlContent = await fs.readFile(path.join(options.outputFolder, `${options.fileName}.html`), 'utf8');
      
//       // Send the HTML content as a response
//       res.setHeader('Content-Type', 'text/html');
//       res.send(htmlContent);
      
//       // Clean up temporary files
//       await fs.unlink(pdfPath);
//       await fs.rmdir(options.outputFolder);
//     } catch (error) {
//       res.status(500).send(`Error converting PDF to HTML: ${error.message}`);
//     }
//   });
  ////////////////////////////////////////////
  app.get('/pdf', async (req, res) => {
    try {
      // Path to your PDF file
      const pdfPath = path.join(__dirname, './assets/test3.pdf');
     ////////////////////////////////////////////////////////////////// 
    //   // Read the PDF file asynchronously
    //   const dataBuffer = await fs.readFile(pdfPath);
      
    //   // Set appropriate headers
    //   res.setHeader('Content-Type', 'application/pdf');
    //   res.setHeader(
    //     'Content-Disposition',
    //     'attachment', filename="document.pdf", filename*=UTF-8\'\'document.pdf'
    //   );
    //   res.setHeader('Content-Length', Buffer.from(dataBuffer).length);
    /////////////////////////////////////////////////////////////////////////

    const dataBuffer = fs.createReadStream('./assets/test3.pdf');
    const stat = fs.statSync('./assets/test3.pdf');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=quote.pdf');
    dataBuffer.pipe(res);
  
      // Send the PDF as the response
      res.send(dataBuffer);
    } catch (error) {
      console.error('Error serving PDF:', error);
      res.status(500).send('Error: Could not serve PDF.');
    }
  });

  ///////////////////////////////////////App comments///////////////////////////////

  const commentsSchema = new mongoose.Schema({
    pathToVerse: {
      type: String ,
      required: false,
     
    }, 
    title: {
      type: String,
      required: false,
      trim: true,
      minlength: 5,
      maxlength: 1000
    },
    content: {
      type: String,
      required: false,
      
    },
    author: {
      type: String,
      required: false
    },
    publishedDate: {
      type: Date,
      default: Date.now
    },
   
    repliesTocomment: [
      {
        // type: mongoose.Schema.Types.ObjectId,
        // ref: 'Comment',
        type: String,
        require: false,
        default: Date.now,
        pathToVerse: String
      }
    ]
  });
  
  // Create the model
  const Comments = mongoose.model('Comments', commentsSchema);
  
  
  app.post('/post-comment', async (req, res) => {
  
    const formData = req.body;
  
  // Process the form data
  console.log(formData);

  // Send a response

    const newComment = new Comments(formData);

    newComment.save()
    .then(doc => {
      console.log("Data saved successfully");
      console.log(doc);
    })
    .catch(error => {
      console.error("Error saving data:", error);
    });

    res.status(200).json({ message: 'Form submitted successfully' });
  });
    
  app.get('/get-allComments', async (req, res) => {

    let response = [];
    const results = await connection && connection.db.collection('comments').find();
    for (let doc = await results.next(); doc != null; doc = await results.next()) {
      response.push(doc);
      /* set and save */
    }
    // response2 = response.map( data => data._id.toString());
    // console.log(response2);
    
    res.status(200).json({data_sq: response});
  });
      
  /////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////

app.listen(3001, () => console.log('Example app is listening on port 3001.'));