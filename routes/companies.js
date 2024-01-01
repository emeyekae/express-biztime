
const express = require("express");
const ExpressError = require("../expressError")
const router = express.Router();
const db = require("../db");

router.get('/', async (req, res, next) => {
  try {
    let results = await db.query(`SELECT * FROM companies`);
    return res.json({ "companies": results.rows })
  } catch (e) {
    return next(e);
  }
})


//GET /companies/[code] : Return obj of company: {company: {code, name, description}}
//If the company given cannot be found, this should return a 404 status response.

// router.get('/:code', async (req, res, next) => {
//   try {
//     let { code } = req.params;
//     let results = await db.query(`SELECT * FROM companies WHERE code = $1`, [code])
//     if (results.rows.length === 0) {
//       throw new ExpressError(`Can't find company with code of ${code}`, 404)
//     }
//     return res.send({ "company": results.rows[0] })
//   } catch (e) {
//     return next(e)
//   }
// })


router.post('/', async (req, res, next) => {
  try {
    let { code, name, description } = req.body;
    // let code = name.toLowerCase().replace(/\s/g, "").substring(0,5); // return lc substring of name without spaces.
    const results = await db.query(`INSERT INTO companies (code,name,description) VALUES ($1, $2, $3) RETURNING code, name, description`, [code, name, description]);
    return res.status(201).json({ "company": results.rows[0] });
  } catch (e) {
    return next(e)
  }
})

router.put('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    const { name, description } = req.body;
    const results = await db.query('UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description', [name, description, code])
    if (results.rows.length === 0) {
      throw new ExpressError(`Can't update company with code of ${code}`, 404)
    }
    return res.send({ "company": results.rows[0] })
  } catch (e) {
    return next(e)
  }
})

router.delete('/:code', async (req, res, next) => {
  try {
    let { code } = req.params;
    const results = await db.query('DELETE FROM companies WHERE code = $1 RETURNING *', [code])
  //  debugger
  // if (typeof results == undefined) {
    if (results.rows.length === 0) {
      throw new ExpressError(`Cannot find company with code of ${code}`, 404);
    }
    return res.send({ status: "deleted" })
  } catch (e) {
    return next(e)
  }
})

//GET /companies/[code] : Return obj of company: {company: {code, name, description, 
//invoices: [id, ...]}} If the company given cannot be found, this should return a 404 status response.

router.get('/:code', async (req, res, next) => {
  try {
    let  { code }  = req.params;
    let results = await db.query(`SELECT a.code, a.name, a.description, b.id, b.amt, b.paid, b.add_date, b.paid_date 
    FROM companies AS a INNER JOIN invoices AS b ON ( a.code = b.comp_code ) WHERE code = $1`,[code]);
    

    if (results.rows.length === 0) {
      throw new ExpressError(`Can't find a company with a code of ${code}`, 404);
    }
    let data = results.rows[0];
    let  company = {
      code: data.code,
      name: data.name,
      description: data.description,
      invoice: {
      id: data.id,
      amt: data.amt,
      paid: data.paid,
      add_date: data.add_date,
      paid_date: data.paid_date,
      },
    };
    return res.json({company: company});
  }
  catch (err) {
    return next(err);
  }
});

module.exports = router;