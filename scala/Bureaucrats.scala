object Bureaucrats {
  val limit = 5000
  var plot = collection.mutable.Buffer[Int]()
  // result in seconds
  def time(fn: => Unit): Double = {
    val start = System.nanoTime
    fn
    (System.nanoTime - start) / 1.0E9
  }
  def benchmark() {
    val a = new Bureaucrats
    while(plot.size < limit) {
      a.go()
      plot :+= a.total
    }
  }
  def main(args: Array[String]) {
    while(true) {
      plot.clear()
      println(5000 / time(benchmark()) + " steps/second")
      for((x, ticks) <- plot.zipWithIndex)
        if(ticks % 250 == 0)
          println(Seq.fill((x - 20000) / 20)('*').mkString)
    }
  }
}

class Bureaucrats {
  val dim = 100
  val N = Array.fill(dim)(Array.fill(dim)(2))
  def rand = util.Random.nextInt(dim)
  var total = 2 * dim * dim
  def go() {
    var active: Seq[(Int, Int)] = List((rand, rand))
    N(active.head._1)(active.head._2) += 1
    total += 1
    while(active.nonEmpty) {
      var nextActive = collection.mutable.ListBuffer[(Int, Int)]()
      for((x, y) <- active)
        if(N(x)(y) > 3) {
          N(x)(y) -= 4
          total -= 4
          def offLoadToNeighbor(dx: Int, dy: Int) = {
            val x2 = x + dx
            val y2 = y + dy
            if(x2 >= 0 && x2 < dim && y2 >= 0 && y2 < dim) {
              N(x2)(y2) += 1
              total += 1
              nextActive += ((x2, y2))
            }
          }
          offLoadToNeighbor(1, 0)
          offLoadToNeighbor(-1, 0)
          offLoadToNeighbor(0, 1)
          offLoadToNeighbor(0, -1)
        }
      active = nextActive
    }
  }
}
