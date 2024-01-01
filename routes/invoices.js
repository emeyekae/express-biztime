const express = require("express");
const ExpressError = require("../expressError")
const router = express.Router();
const db = require("../db");

router.get('/', async (req, res, next) => {
  try {
    let results = await db.query(`SELECT * FROM invoices`);
    return res.json({ "invoices": results.rows })
  } catch (e) {
    return next(e);
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    let id = req.params.id;
    let results = await db.query(`SELECT a.id, a.comp_code, a.amt, a.paid, a.add_date, a.paid_date, b.name, b.description  FROM invoices AS a INNER JOIN companies AS b  ON (a.comp_code = b.code) WHERE id = $1`, [id]);
    if (results.rows.length === 0) {
      throw new ExpressError(`Can't find invoice with id of ${id}`, 404);
    }
    const data = results.rows[0];
    const invoice = {
      id: data.id,
      amt: data.amt,
      paid: data.paid,
      add_date: data.add_date,
      paid_date: data.paid_date,
      company: {
        code: data.comp_code,
        name: data.name,
        description: data.description,
      },
    };

    return res.json({"invoice": invoice});
  }

  catch (err) {
    return next(err);
  }
});


router.post('/', async (req, res, next) => {
  try {
    let { comp_code, amt } = req.body;
    const results = await db.query(`INSERT INTO invoices (comp_code,amt) VALUES ($1, $2) RETURNING id, comp_code, amt,paid, add_date,paid_date`, [comp_code, amt]);
    return res.status(201).json({ "invoice": results.rows[0] });
  } catch (e) {
    return next(e)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    let {amt} = req.body;
    let id =  req.params.id;
    let paidDate = null;
    const myResults = await db.query(`SELECT paid, paid_date FROM invoices WHERE id= $1`, [id]);
    if (myResults.rows.length === 0) {
      throw new ExpressError(`There is no invoice with an id of ${id}`, 404)
    }
   const myPaidDate = myResults.rows[0].paid_date;
   let myPaid = myResults.rows[0].paid;
   console.log(`${myPaidDate}, ${myPaid}`)
  
   if (myPaid && myPaidDate !== null) {
    paid_date = new Date();
    paid = myPaid;
  } else if (!myPaid && myPaidDate === null) {
    paid_date = new Date();
    paid = true;
  } else {
    paid_date = new Date();
    paid = true;
  }
  const result = await db.query(`UPDATE invoices SET amt=$1, paid=$2, paid_date=$3 WHERE id=$4 RETURNING id, comp_code, amt, paid, add_date, paid_date`,[amt, paid, paid_date, id]);
  return res.json({"invoice": result.rows[0]});
  } catch (e) {
    return next(e)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    let id = req.params.id;
    const results = await db.query(`DELETE FROM invoices WHERE id = $1 RETURNING id`, [id]);
  //  debugger

    if (results.rows.length === 0) {
      throw new ExpressError(`Cannot find invoice with and id of ${id}`, 404);
  }
    return res.json({ status: "deleted" })
  } catch (e) {
    return next(e)
  }
})

router.get('/:code', async (req, res, next) => {
    try {
      let  { code }  = req.params;
      let results = await db.query(`SELECT a.code, a.name, a.description, b.id, b.amt, b.paid, b.add_date, b.paid_date 
      FROM companines AS a INNER JOIN invoices AS b ON ( a.code = b.comp_code ) WHERE code = $1`,[code]);
      
      debugger;

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