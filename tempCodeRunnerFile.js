const result = await postCollection
        .find({ seller_email: req.params.email })
        .toArray();
      res.send(result);